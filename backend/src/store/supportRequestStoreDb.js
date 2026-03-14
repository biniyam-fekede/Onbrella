/**
 * Database-backed support request store for help/support complaints.
 */
const db = require("../db");

const SUPPORT_REASON_LABELS = {
  station_empty: "Station Empty",
  station_full: "Station Full",
  damaged_umbrella: "Damaged Umbrella",
  app_issue: "App Issue",
  other: "Other",
};

const SUPPORT_STATUS_OPEN = "open";
const SUPPORT_STATUS_RESOLVED = "resolved";
const SUPPORT_SEVERITY_CRITICAL = "critical";
const SUPPORT_SEVERITY_NON_CRITICAL = "non_critical";

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getReasonLabel(reason) {
  return SUPPORT_REASON_LABELS[reason] || "Support Request";
}

function getSeverityForReason(reason) {
  return reason === "other"
    ? SUPPORT_SEVERITY_NON_CRITICAL
    : SUPPORT_SEVERITY_CRITICAL;
}

function rowToSupportRequest(row) {
  if (!row) return null;

  const reasonLabel = getReasonLabel(row.reason);
  return {
    id: row.id,
    source: "support_request",
    type: "support_request",
    status: row.status || SUPPORT_STATUS_OPEN,
    severity: row.severity || SUPPORT_SEVERITY_CRITICAL,
    userId: row.user_id || null,
    userEmail: row.user_email || null,
    sessionId: row.session_id || null,
    reason: row.reason || null,
    reasonLabel,
    details: row.details || "",
    message: reasonLabel,
    createdAt: toIso(row.created_at),
    resolvedAt: toIso(row.resolved_at),
    resolverId: row.resolved_by || null,
  };
}

async function create({ userId, userEmail, sessionId, reason, details = "" }) {
  const { rows } = await db.query(
    `INSERT INTO support_requests (user_id, user_email, session_id, reason, details, severity, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      userEmail || null,
      sessionId || null,
      reason,
      details || "",
      getSeverityForReason(reason),
      SUPPORT_STATUS_OPEN,
    ]
  );

  return rowToSupportRequest(rows[0]);
}

async function listAllForAdmin() {
  const { rows } = await db.query(
    `SELECT *
     FROM support_requests
     ORDER BY created_at DESC`
  );

  return rows.map(rowToSupportRequest);
}

async function countOpen() {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM support_requests
     WHERE status = $1`,
    [SUPPORT_STATUS_OPEN]
  );

  return rows[0]?.count ?? 0;
}

async function resolve(id, resolverId) {
  const { rows } = await db.query(
    `UPDATE support_requests
     SET status = $2,
         resolved_at = now(),
         resolved_by = $3
     WHERE id = $1 AND status = $4
     RETURNING *`,
    [id, SUPPORT_STATUS_RESOLVED, resolverId || null, SUPPORT_STATUS_OPEN]
  );

  return rowToSupportRequest(rows[0]);
}

module.exports = {
  SUPPORT_REASON_LABELS,
  SUPPORT_STATUS_OPEN,
  SUPPORT_STATUS_RESOLVED,
  SUPPORT_SEVERITY_CRITICAL,
  SUPPORT_SEVERITY_NON_CRITICAL,
  getReasonLabel,
  getSeverityForReason,
  create,
  listAllForAdmin,
  countOpen,
  resolve,
};
