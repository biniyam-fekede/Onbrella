/**
 * Database-backed rental store. Uses the `rentals` table in Supabase.
 * Same interface as rentalStore but async; used when DATABASE_URL is set.
 */

const db = require("../db");

function _umbrellaId(stationId, slotNumber = 0) {
  return `umbrella-${stationId}-${slotNumber}`;
}

function _rentalId() {
  return `rental-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function _rowToRental(row) {
  if (!row) return null;
  return {
    rentalId: row.rental_id,
    sessionId: row.session_id,
    umbrellaId: row.umbrella_id,
    stationId: row.station_id,
    slotNumber: row.slot_number,
    startTime: row.start_time ? new Date(row.start_time).toISOString() : null,
    endTime: row.end_time ? new Date(row.end_time).toISOString() : null,
    returnStationId: row.return_station_id,
    returnSlotNumber: row.return_slot_number,
    status: row.status,
  };
}

/**
 * @param {string} sessionId
 * @param {string} stationId
 * @param {number} slotNumber
 * @returns {Promise<{ rentalId: string, umbrellaId: string, startTime: string }>}
 */
async function create(sessionId, stationId, slotNumber = 0) {
  const rentalId = _rentalId();
  const umbrellaId = _umbrellaId(stationId, slotNumber);
  await db.query(
    `INSERT INTO rentals (rental_id, session_id, umbrella_id, station_id, slot_number, start_time, status)
     VALUES ($1, $2, $3, $4, $5, now(), 'ACTIVE')`,
    [rentalId, sessionId, umbrellaId, stationId, slotNumber]
  );
  const startTime = new Date().toISOString();
  return {
    rentalId,
    umbrellaId,
    startTime,
  };
}

/**
 * @param {string} rentalId UUID
 * @param {string} returnStationId
 * @param {number} slotNumber
 * @returns {Promise<object|null>} Updated rental or null
 */
async function complete(rentalId, returnStationId, slotNumber = 0) {
  const { rows } = await db.query(
    `UPDATE rentals
     SET end_time = now(), return_station_id = $2, return_slot_number = $3, status = 'COMPLETED'
     WHERE rental_id = $1 AND status = 'ACTIVE'
     RETURNING *`,
    [rentalId, returnStationId, slotNumber]
  );
  return rows[0] ? _rowToRental(rows[0]) : null;
}

/**
 * @param {string} sessionId
 * @returns {Promise<object|null>} Active rental or null
 */
async function getActiveBySession(sessionId) {
  const { rows } = await db.query(
    `SELECT * FROM rentals WHERE session_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [sessionId]
  );
  return rows[0] ? _rowToRental(rows[0]) : null;
}

/**
 * @param {string} rentalId
 * @returns {Promise<object|null>}
 */
async function getById(rentalId) {
  const { rows } = await db.query(`SELECT * FROM rentals WHERE rental_id = $1`, [rentalId]);
  return rows[0] ? _rowToRental(rows[0]) : null;
}

/**
 * List completed rentals for a session, most recent first.
 * @param {string} sessionId
 * @param {object} options
 * @param {number} [options.limit=20]
 * @param {number} [options.offset=0]
 * @returns {Promise<Array<object>>}
 */
async function listBySession(sessionId, { limit = 20, offset = 0 } = {}) {
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  const { rows } = await db.query(
    `SELECT * FROM rentals
     WHERE session_id = $1 AND status = 'COMPLETED'
     ORDER BY start_time DESC
     LIMIT $2 OFFSET $3`,
    [sessionId, safeLimit, safeOffset]
  );

  return rows.map(_rowToRental);
}

/**
 * Count rentals for a session. Useful for pagination.
 * @param {string} sessionId
 * @returns {Promise<number>}
 */
async function countBySession(sessionId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM rentals WHERE session_id = $1`,
    [sessionId]
  );
  return rows[0]?.count ?? 0;
}

/**
 * Count all active (in-progress) rentals across all sessions. For admin dashboard.
 * @returns {Promise<number>}
 */
async function countActiveRentals() {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM rentals WHERE status = 'ACTIVE'`
  );
  return rows[0]?.count ?? 0;
}

/**
 * List recent rentals for admin activity feed. Joins profiles for user display name.
 * @param {number} [limit=50]
 * @returns {Promise<Array<object>>} Rentals with userFullName, userEmail (null if guest/unknown)
 */
async function listRecentForAdmin(limit = 50) {
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 50;
  const { rows } = await db.query(
    `SELECT r.rental_id, r.session_id, r.umbrella_id, r.station_id, r.slot_number,
            r.start_time, r.end_time, r.return_station_id, r.return_slot_number, r.status,
            p.full_name AS user_full_name, p.email AS user_email
     FROM rentals r
     LEFT JOIN profiles p ON r.session_id = p.id
     ORDER BY r.start_time DESC
     LIMIT $1`,
    [safeLimit]
  );
  return rows.map((row) => ({
    rentalId: row.rental_id,
    sessionId: row.session_id,
    umbrellaId: row.umbrella_id,
    stationId: row.station_id,
    slotNumber: row.slot_number,
    startTime: row.start_time ? new Date(row.start_time).toISOString() : null,
    endTime: row.end_time ? new Date(row.end_time).toISOString() : null,
    returnStationId: row.return_station_id,
    returnSlotNumber: row.return_slot_number,
    status: row.status,
    userFullName: row.user_full_name || null,
    userEmail: row.user_email || null,
  }));
}

/**
 * Aggregate rental starts into hourly buckets for the admin dashboard trend chart.
 * Returns oldest-to-newest buckets covering the trailing N hours, including the current hour.
 * @param {number} [hours=24]
 * @returns {Promise<Array<{ bucketStart: string, count: number }>>}
 */
async function listTrendBuckets(hours = 24) {
  const safeHours = Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 24;
  const { rows } = await db.query(
    `WITH buckets AS (
       SELECT generate_series(
         date_trunc('hour', now()) - (($1::int - 1) * interval '1 hour'),
         date_trunc('hour', now()),
         interval '1 hour'
       ) AS bucket_start
     )
     SELECT b.bucket_start, COALESCE(COUNT(r.rental_id), 0)::int AS count
     FROM buckets b
     LEFT JOIN rentals r
       ON r.start_time >= b.bucket_start
      AND r.start_time < b.bucket_start + interval '1 hour'
     GROUP BY b.bucket_start
     ORDER BY b.bucket_start ASC`,
    [safeHours]
  );

  return rows.map((row) => ({
    bucketStart: row.bucket_start ? new Date(row.bucket_start).toISOString() : null,
    count: row.count ?? 0,
  }));
}

module.exports = {
  create,
  complete,
  getActiveBySession,
  getById,
  listBySession,
  countBySession,
  countActiveRentals,
  listRecentForAdmin,
  listTrendBuckets,
};
