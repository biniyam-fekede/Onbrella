/**
 * API client for On-Brella backend. Single implementation; swap for mock in tests.
 *
 * All requests send X-Session-Id so rent, return, and history use the same session.
 * Session is stored in sessionStorage (key from config); same tab = same session.
 */
import { config } from "../config";

const base = config.apiBaseUrl || "";

/**
 * Get or create the current session ID (persisted in sessionStorage).
 * Used by the backend to group rentals and history per browser session.
 */
function getSessionId() {
  try {
    let sid = sessionStorage.getItem(config.sessionStorageKey);
    if (!sid) {
      sid = `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(config.sessionStorageKey, sid);
    }
    return sid;
  } catch {
    return "guest";
  }
}

/**
 * Send a request to the backend. Adds X-Session-Id and JSON content type.
 * Throws an Error with .status and .payload on non-OK response.
 * @param {object} [opts] - Optional. { accessToken: string } to add Authorization: Bearer (e.g. for admin map filter).
 */
async function request(method, path, body = null, opts = {}) {
  const url = `${base}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Session-Id": getSessionId(),
  };
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }
  const options = { method, headers };
  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * @param {object} [options] - Optional. { accessToken: string } to send with request (backend filters by admin location when valid admin token).
 * @returns {Promise<{ stations: Array, totalStations: number }>}
 */
export async function getStations(options = {}) {
  return request("GET", "/api/stations", null, options);
}

/**
 * @param {string} stationId
 * @returns {Promise<{ success: boolean, rentalId: string, umbrellaId: string, startTime: string }>}
 */
export async function startRental(stationId) {
  return request("POST", "/api/rent", { stationId });
}

/**
 * @param {string} rentalId
 * @param {string} stationId
 * @param {string} umbrellaId
 * @returns {Promise<{ success: boolean, rentalId: string, endTime: string }>}
 */
export async function endRental(rentalId, stationId, umbrellaId) {
  return request("POST", "/api/return", {
    rentalId,
    stationId,
    umbrellaId,
  });
}

/**
 * Fetch paginated rental history for the current session.
 * @param {object} options
 * @param {number} [options.limit=20]
 * @param {number} [options.offset=0]
 * @returns {Promise<{ rentals: Array, total: number, limit: number, offset: number }>}
 */
export async function getRentalHistory({ limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const path = params.toString()
    ? `/api/history?${params.toString()}`
    : "/api/history";

  return request("GET", path);
}

/**
 * Create a Stripe PaymentIntent for a completed rental.
 *
 * The backend calculates the final rental amount using the rental record
 * and returns the clientSecret needed by Stripe Elements on the frontend.
 *
 * @param {string} rentalId
 * @returns {Promise<{ paymentIntentId: string, clientSecret: string, amount: number, currency: string, status: string }>}
 */
export async function createCheckoutSession(rentalId) {
  return request("POST", "/api/payments/create-checkout-session", { rentalId });
}

export { getSessionId };
