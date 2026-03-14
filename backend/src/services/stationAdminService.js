/**
 * Admin-only station operations: create/update station in DB and optionally notify hardware.
 * Keeps route thin; validation and orchestration live here.
 * Location-scoped admins (adminLocationId set) can only manage stations in their location.
 */

const stationsDb = require("../db/stations");
const {
  validateStationPayload,
  validateStatus,
  validateStationId,
  validateStationUpdatePayload,
} = require("../lib/stationValidation");
const hardwareClient = require("./hardwareClient");
const db = require("../db");

/**
 * Ensure the station belongs to one of the admin's assigned locations (or admin is super). Throws 404 if not allowed.
 */
async function assertStationInLocation(stationId, adminLocationId, isSuperAdmin, adminLocationIds = []) {
  if (isSuperAdmin) return;
  const allowedIds = adminLocationIds?.length > 0 ? adminLocationIds : (adminLocationId ? [adminLocationId] : []);
  if (allowedIds.length === 0) return;
  let stationLocationId;
  try {
    stationLocationId = await stationsDb.getStationLocationId(stationId);
  } catch {
    stationLocationId = null;
  }
  if (!stationLocationId || !allowedIds.includes(stationLocationId)) {
    const err = new Error("Station not found");
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Create or update a station. Persists to DB; optionally notifies hardware (best-effort).
 * @param {object} payload - { stationId, capacity, latitude?, longitude?, status? }
 * @param {object} [scope] - { adminLocationId, isSuperAdmin }. When set, new/updated station is tied to adminLocationId.
 * @returns {Promise<object>} The upserted station row (station_id, capacity, num_brellas, status, etc.)
 * @throws {Error} When validation fails or DB is not configured
 */
async function createOrUpdateStation(payload, scope = {}) {
  const normalized = validateStationPayload(payload);

  if (!db.getPool()) {
    throw new Error("Database not configured. Set DATABASE_URL in backend/.env");
  }

  const locationId = scope.isSuperAdmin ? null : scope.adminLocationId || null;
  const row = await stationsDb.upsertStation({ ...normalized, locationId });

  // Best-effort: notify hardware layer so it can register the station if supported.
  try {
    await hardwareClient.registerStation({
      stationId: normalized.stationId,
      location:
        normalized.latitude != null && normalized.longitude != null
          ? { latitude: normalized.latitude, longitude: normalized.longitude }
          : undefined,
      capacity: normalized.capacity,
      status: normalized.status,
    });
  } catch {
    // Hardware may not support POST /hardware/stations; station is already in DB.
  }

  return row;
}

/**
 * Update a station's status only (operational | out_of_service | maintenance).
 * @param {string} stationId
 * @param {string} status
 * @param {object} [scope] - { adminLocationId, isSuperAdmin } for location check
 * @returns {Promise<object>} Updated row
 * @throws {Error} When validation fails or DB not configured or station not found
 */
async function updateStationStatus(stationId, status, scope = {}) {
  const normalizedStatus = validateStatus(status);

  if (!db.getPool()) {
    throw new Error("Database not configured. Set DATABASE_URL in backend/.env");
  }

  await assertStationInLocation(
    stationId,
    scope.adminLocationId,
    scope.isSuperAdmin,
    scope.adminLocationIds
  );

  const row = await stationsDb.updateStatus(stationId, normalizedStatus);
  if (!row) {
    const err = new Error("Station not found");
    err.statusCode = 404;
    throw err;
  }

  return row;
}

/**
 * Partially update a station (name, latitude, longitude, capacity, status).
 * @param {string} stationId
 * @param {object} body - { name?, latitude?, longitude?, capacity?, status? }
 * @param {object} [scope] - { adminLocationId, isSuperAdmin } for location check
 * @returns {Promise<object>} Updated row
 * @throws {Error} When validation fails or station not found
 */
async function updateStation(stationId, body, scope = {}) {
  const id = validateStationId(String(stationId ?? "").trim());
  const normalized = validateStationUpdatePayload(body);

  if (!db.getPool()) {
    throw new Error("Database not configured. Set DATABASE_URL in backend/.env");
  }

  await assertStationInLocation(
    id,
    scope.adminLocationId,
    scope.isSuperAdmin,
    scope.adminLocationIds
  );

  const row = await stationsDb.updateStation(id, normalized);
  if (!row) {
    const err = new Error("Station not found");
    err.statusCode = 404;
    throw err;
  }

  return row;
}

/**
 * Delete a station from the database (removes from map and admin lists).
 * @param {string} stationId
 * @param {object} [scope] - { adminLocationId, isSuperAdmin } for location check
 * @returns {Promise<{ deleted: boolean }>}
 * @throws {Error} When stationId invalid or DB not configured
 */
async function deleteStation(stationId, scope = {}) {
  const id = validateStationId(String(stationId ?? "").trim());

  if (!db.getPool()) {
    throw new Error("Database not configured. Set DATABASE_URL in backend/.env");
  }

  await assertStationInLocation(
    id,
    scope.adminLocationId,
    scope.isSuperAdmin,
    scope.adminLocationIds
  );

  const deleted = await stationsDb.deleteStation(id);
  if (!deleted) {
    const err = new Error("Station not found");
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
}

module.exports = {
  createOrUpdateStation,
  updateStationStatus,
  updateStation,
  deleteStation,
};
