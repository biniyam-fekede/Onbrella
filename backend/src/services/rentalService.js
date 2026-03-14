/**
 * Business logic for umbrella rentals.
 * Enforces rules: one active rental per session, availability checks, etc.
 */

const hardwareClient = require("./hardwareClient");
const getRentalStore = require("../store/getRentalStore");
const stationsDb = require("../db/stations");
const configDb = require("../db/config");

class RentalError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "RentalError";
    this.statusCode = statusCode;
  }
}

/**
 * Format a DB station row for the public API (map + clients). Includes location for map markers.
 */
function formatDbStationForApi(row) {
  const stationId = row.station_id;
  const capacity = row.capacity ?? 10;
  const numUmbrellas = row.num_brellas ?? capacity;
  const lat = row.latitude != null ? Number(row.latitude) : null;
  const lng = row.longitude != null ? Number(row.longitude) : null;
  return {
    stationId,
    name: row.name ?? null,
    latitude: lat,
    longitude: lng,
    location: lat != null && lng != null ? { latitude: lat, longitude: lng } : null,
    capacity,
    numUmbrellas,
    availableSlots: Math.max(0, capacity - numUmbrellas),
    status: row.status || "operational",
  };
}

/**
 * List stations for map/inventory. When opts.locationId or opts.locationIds are set (location-scoped admin),
 * returns only those stations and skips hardware fallback.
 * @param {object} [opts] - Optional. { locationId: string } or { locationIds: string[] } to scope by location.
 * @returns {Promise<{stations: Array, totalStations: number}>}
 */
async function getStations(opts = {}) {
  const hasDb = !!require("../db").getPool();
  const locationId = opts.locationId ?? null;
  const locationIds = opts.locationIds && Array.isArray(opts.locationIds) ? opts.locationIds.filter(Boolean) : [];
  const isLocationScoped = locationIds.length > 0 || locationId != null;

  if (hasDb) {
    const listOpts = locationIds.length > 0 ? { locationIds } : { locationId };
    const rows = await stationsDb.listStations(listOpts);
    if (isLocationScoped) {
      // Location-scoped admin: return only DB stations for assigned location(s) (no hardware fallback)
      const stations = rows.map((r) => formatDbStationForApi(r));
      return { stations, totalStations: stations.length };
    }
    if (rows.length > 0) {
      const stations = rows.map((r) => formatDbStationForApi(r));
      return { stations, totalStations: stations.length };
    }
  }

  try {
    const { stations: rawStations, totalStations } = await hardwareClient.getStations();
    const stations = await Promise.all(
      rawStations.map(async (s) => {
        const capacity = s.capacity ?? 10;
        let numUmbrellas = capacity;
        let row = null;
        if (hasDb) {
          await stationsDb.upsertStation({
            stationId: s.stationId,
            latitude: s.location?.latitude,
            longitude: s.location?.longitude,
            capacity,
            status: s.status ?? "operational",
          });
          row = await stationsDb.getByStationId(s.stationId);
          if (row) numUmbrellas = row.num_brellas ?? capacity;
        }
        const availableSlots = Math.max(0, capacity - numUmbrellas);
        const status = row?.status ?? s.status ?? "operational";
        return {
          ...s,
          name: row?.name ?? s.name,
          numUmbrellas,
          availableSlots,
          status,
        };
      })
    );
    return { stations, totalStations };
  } catch {
    return { stations: [], totalStations: 0 };
  }
}

/**
 * Start a rental. Validates: no active rental for session; station has availability.
 * @param {string} sessionId
 * @param {string} stationId
 * @returns {Promise<{success: boolean, rentalId: string, umbrellaId: string, startTime: string}>}
 */
async function startRental(sessionId, stationId) {
  const store = getRentalStore();
  const existing = await store.getActiveBySession(sessionId);
  if (existing) {
    throw new RentalError("Session already has an active rental", 409);
  }

  const { unlock } = hardwareClient;

  try {
    await unlock(stationId);
  } catch (err) {
    if (err.statusCode === 502 || err.message?.includes("fetch failed")) {
      throw new RentalError("Hardware unavailable", 503);
    }
    throw new RentalError(err.message || "Unlock failed", err.statusCode || 409);
  }

  const { rentalId, umbrellaId, startTime } = await store.create(sessionId, stationId);

  await stationsDb.decrementNumBrellas(stationId);

  return {
    success: true,
    rentalId,
    umbrellaId,
    startTime,
  };
}

/**
 * End a rental. Validates: rental exists, is ACTIVE, station has capacity.
 * @param {string} sessionId
 * @param {string} rentalId
 * @param {string} stationId
 * @param {string} umbrellaId
 * @returns {Promise<{success: boolean, rentalId: string, endTime: string, costCents: number, durationMs: number}>}
 */
async function endRental(sessionId, rentalId, stationId, umbrellaId) {
  const store = getRentalStore();
  const rental = await store.getById(rentalId);

  if (!rental) {
    throw new RentalError("Rental not found", 404);
  }
  if (rental.status !== "ACTIVE") {
    throw new RentalError("Rental is not active", 409);
  }
  if (rental.sessionId !== sessionId) {
    throw new RentalError("Rental does not belong to this session", 403);
  }

  const returnStation = await stationsDb.getByStationId(stationId);
  if (!returnStation) {
    throw new RentalError("Return station not found", 404);
  }

  const capacity = returnStation.capacity ?? 10;
  const numUmbrellas = returnStation.num_brellas ?? 0;

  if (numUmbrellas >= capacity) {
    throw new RentalError("Return station is full", 409);
  }

  const { returnUmbrella } = hardwareClient;

  try {
    await returnUmbrella(stationId, umbrellaId);
  } catch (err) {
    if (err.statusCode === 502 || err.message?.includes("fetch failed")) {
      throw new RentalError("Hardware unavailable", 503);
    }
    throw new RentalError(err.message || "Return failed", err.statusCode || 409);
  }

  const updated = await store.complete(rentalId, stationId);
  if (!updated) {
    throw new RentalError("Failed to complete rental", 500);
  }

  await stationsDb.incrementNumBrellas(stationId);

  const startTime = new Date(rental.startTime).getTime();
  const endTime = new Date(updated.endTime).getTime();
  const durationMs = endTime - startTime;
  const minutes = Math.ceil(durationMs / 60000);
  const unlockFeeCents = parseInt(await configDb.get("unlockFeeCents") || "100", 10);
  const centsPerMinute = parseInt(await configDb.get("centsPerMinute") || "10", 10);
  const costCents = unlockFeeCents + minutes * centsPerMinute;

  return {
    success: true,
    rentalId,
    endTime: updated.endTime,
    costCents,
    durationMs,
  };
}

module.exports = {
  getStations,
  startRental,
  endRental,
  RentalError,
};