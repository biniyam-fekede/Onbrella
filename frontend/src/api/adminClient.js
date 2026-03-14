/**
 * Admin API client. Sends Supabase session as Bearer token; backend verifies and checks admin role.
 * Uses cached token when still valid to avoid hitting refresh_token too often (429 rate limit).
 */
import { supabase } from "@/lib/supabase/client";
import { config } from "../config";

const base = config.apiBaseUrl || "";

/** JWT payload exp is seconds since epoch. Consider valid if at least this many seconds left. */
const TOKEN_BUFFER_SEC = 60;

/** In-flight refresh promise so parallel admin requests share one refresh (avoids 429). */
let refreshPromise = null;

/**
 * Decode JWT payload without verification (we only need exp). Returns null if invalid.
 */
function getJwtExp(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Get a valid access token. Uses current session if token is not expired (avoids refresh on every request).
 * Only calls refreshSession() when token is missing or expiring soon; deduplicates concurrent refreshes.
 */
async function getAccessToken() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  const token = session?.access_token;
  const exp = token ? getJwtExp(token) : null;
  const nowSec = Math.floor(Date.now() / 1000);

  if (token && exp != null && exp > nowSec + TOKEN_BUFFER_SEC) {
    return token;
  }

  if (!refreshPromise) {
    refreshPromise = supabase.auth.refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  const { data, error } = await refreshPromise;
  const newToken = data?.session?.access_token;
  if (error || !newToken) {
    throw new Error("Not authenticated");
  }
  return newToken;
}

/**
 * Request to an admin-only endpoint. Adds Authorization: Bearer <access_token>.
 * On 401, throws without refreshing or signing out so the admin page stays reachable.
 */
async function adminRequest(method, path, body = null) {
  const token = await getAccessToken();
  const url = `${base}${path}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const options = { method, headers };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const err = new Error(data.error || "Session expired or access denied.");
    err.status = 401;
    err.payload = data;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * @returns {Promise<{ usersCount: number, reportsCount: number, openReportsCount: number, activeRentalsCount: number, activeSessions: number, totalUmbrellas: number }>}
 */
export async function adminGetStats() {
  return adminRequest("GET", "/api/admin/stats");
}

/**
 * @returns {Promise<{ users: Array<{ id: string, email: string, full_name: string, role: string }> }>}
 */
export async function adminGetUsers() {
  return adminRequest("GET", "/api/admin/users");
}

/**
 * @returns {Promise<{ activities: Array<object> }>} Recent rentals with userFullName, userEmail.
 */
export async function adminGetActivity(limit = 50) {
  return adminRequest("GET", `/api/admin/activity?limit=${Math.min(100, Math.max(1, Number(limit) || 50))}`);
}

/**
 * @param {number} [hours=24]
 * @returns {Promise<{ hours: number, buckets: Array<{ bucketStart: string, count: number }> }>}
 */
export async function adminGetRentalTrends(hours = 24) {
  return adminRequest(
    "GET",
    `/api/admin/trends?hours=${Math.min(168, Math.max(1, Number(hours) || 24))}`
  );
}

/**
 * @returns {Promise<{ reports: Array }>}
 */
export async function adminGetReports() {
  return adminRequest("GET", "/api/admin/reports");
}

/**
 * @param {string} reportId
 * @returns {Promise<{ report: object }>}
 */
export async function adminResolveReport(reportId) {
  return adminRequest("POST", `/api/admin/reports/${encodeURIComponent(reportId)}/resolve`);
}

/**
 * List all stations from the database (admin only; no hardware dependency).
 * @returns {Promise<{ stations: Array<{ stationId: string, name?: string, capacity: number, numUmbrellas: number, status: string }> }>}
 */
export async function adminGetStations() {
  return adminRequest("GET", "/api/admin/stations");
}

/**
 * Create or update a station (upsert).
 * @param {object} station - { stationId: string, capacity: number, name?: string, latitude?: number, longitude?: number, status?: string }
 * @returns {Promise<{ station: object }>}
 */
export async function adminCreateStation(station) {
  return adminRequest("POST", "/api/admin/stations", station);
}

/**
 * Update a station's status (operational | out_of_service | maintenance).
 * @param {string} stationId
 * @param {string} status
 * @returns {Promise<{ station: object }>}
 */
export async function adminUpdateStationStatus(stationId, status) {
  return adminRequest("PATCH", `/api/admin/stations/${encodeURIComponent(stationId)}`, {
    status,
  });
}

/**
 * Update station details (name, latitude, longitude, capacity, status).
 * @param {string} stationId
 * @param {object} payload - { name?, latitude?, longitude?, capacity?, status? }
 * @returns {Promise<{ station: object }>}
 */
export async function adminUpdateStation(stationId, payload) {
  return adminRequest("PUT", `/api/admin/stations/${encodeURIComponent(stationId)}`, payload);
}

/**
 * Delete a station from the database (removes from map and admin lists).
 * @param {string} stationId
 * @returns {Promise<void>}
 */
export async function adminDeleteStation(stationId) {
  return adminRequest("DELETE", `/api/admin/stations/${encodeURIComponent(stationId)}`);
}

/**
 * Get current pricing settings from the backend.
 * @returns {Promise<{unlockFeeCents: number, centsPerMinute: number}>}
 */
export async function adminGetPricing() {
  return adminRequest("GET", "/api/admin/pricing");
}

/**
 * Update pricing settings in the backend.
 * @param {number} unlockFeeCents
 * @param {number} centsPerMinute
 * @returns {Promise<{unlockFeeCents: number, centsPerMinute: number}>}
 */
export async function adminUpdatePricing(unlockFeeCents, centsPerMinute) {
  return adminRequest("PUT", "/api/admin/pricing", { unlockFeeCents, centsPerMinute });
}

/**
 * @param {string} contentKey
 * @returns {Promise<{ key: string, document: object, updatedAt: string|null, updatedBy: string|null, source: string }>}
 */
export async function adminGetContent(contentKey) {
  return adminRequest("GET", `/api/admin/content/${encodeURIComponent(contentKey)}`);
}

/**
 * @param {string} contentKey
 * @param {object} document
 * @returns {Promise<{ key: string, document: object, updatedAt: string|null, updatedBy: string|null, source: string }>}
 */
export async function adminUpdateContent(contentKey, document) {
  return adminRequest("PUT", `/api/admin/content/${encodeURIComponent(contentKey)}`, { document });
}
