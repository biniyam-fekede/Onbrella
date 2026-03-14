/**
 * Validation for station payloads. Shared by admin API and services.
 * Throws with a clear message on invalid input.
 */

const VALID_STATUSES = new Set(["operational", "out_of_service", "maintenance"]);

/**
 * @param {string} stationId
 * @throws {Error}
 */
function validateStationId(stationId) {
  if (stationId == null || typeof stationId !== "string") {
    throw new Error("stationId is required and must be a string");
  }
  const trimmed = stationId.trim();
  if (trimmed.length === 0) {
    throw new Error("stationId cannot be empty");
  }
  if (trimmed.length > 128) {
    throw new Error("stationId must be at most 128 characters");
  }
  return trimmed;
}

/**
 * @param {number} capacity
 * @throws {Error}
 */
function validateCapacity(capacity) {
  const n = Number(capacity);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("capacity must be a positive integer");
  }
  if (n > 9999) {
    throw new Error("capacity must be at most 9999");
  }
  return n;
}

/**
 * @param {number} value
 * @param {string} field
 * @throws {Error}
 */
function validateLatLong(value, field) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new Error(`${field} must be a number`);
  }
  if (field === "latitude" && (n < -90 || n > 90)) {
    throw new Error("latitude must be between -90 and 90");
  }
  if (field === "longitude" && (n < -180 || n > 180)) {
    throw new Error("longitude must be between -180 and 180");
  }
  return n;
}

/**
 * @param {string} status
 * @throws {Error}
 */
function validateStatus(status) {
  if (status == null || status === "") return "operational";
  const s = String(status).trim().toLowerCase();
  if (!VALID_STATUSES.has(s)) {
    throw new Error(`status must be one of: ${[...VALID_STATUSES].join(", ")}`);
  }
  return s;
}

/**
 * @param {string} name - Optional display name
 * @returns {string|null}
 */
function validateName(name) {
  if (name == null || name === "") return null;
  const s = String(name).trim();
  if (s.length > 256) {
    throw new Error("name must be at most 256 characters");
  }
  return s || null;
}

/**
 * Validate and normalize admin station payload.
 * @param {object} body - { stationId, capacity, name?, latitude?, longitude?, status? }
 * @returns {{ stationId: string, capacity: number, name: string|null, latitude: number|null, longitude: number|null, status: string }}
 */
function validateStationPayload(body) {
  const stationId = validateStationId(body.stationId);
  const capacity = validateCapacity(body.capacity);
  const name = validateName(body.name);
  const latitude = validateLatLong(body.latitude, "latitude");
  const longitude = validateLatLong(body.longitude, "longitude");
  const status = validateStatus(body.status);

  return {
    stationId,
    capacity,
    name,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    status,
  };
}

const UPDATE_KEYS = ["name", "latitude", "longitude", "capacity", "status"];

/**
 * Validate and normalize PATCH/PUT station update payload. All fields optional; at least one required.
 * @param {object} body - { name?, latitude?, longitude?, capacity?, status? }
 * @returns {{ name?: string|null, latitude?: number|null, longitude?: number|null, capacity?: number, status?: string }}
 */
function validateStationUpdatePayload(body) {
  if (body == null || typeof body !== "object") {
    throw new Error("Request body must be an object with at least one of: name, latitude, longitude, capacity, status");
  }
  const hasAny = UPDATE_KEYS.some((k) => body[k] !== undefined && body[k] !== null);
  if (!hasAny) {
    throw new Error("Provide at least one field to update: name, latitude, longitude, capacity, status");
  }
  const out = {};
  if (body.name !== undefined) out.name = validateName(body.name);
  if (body.latitude !== undefined) out.latitude = validateLatLong(body.latitude, "latitude");
  if (body.longitude !== undefined) out.longitude = validateLatLong(body.longitude, "longitude");
  if (body.capacity !== undefined) out.capacity = validateCapacity(body.capacity);
  if (body.status !== undefined) out.status = validateStatus(body.status);
  return out;
}

module.exports = {
  validateStationId,
  validateCapacity,
  validateName,
  validateLatLong,
  validateStatus,
  validateStationPayload,
  validateStationUpdatePayload,
  VALID_STATUSES,
};
