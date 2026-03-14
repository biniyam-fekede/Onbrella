/**
 * Station names and addresses. API-driven with fallback to hard-coded data.
 * Fetches from backend when available.
 */
import * as api from "../api/client";

/** Cache for station data */
let stationCache = null;
let stationCachePromise = null;

/** Fallback hard-coded names for offline/error scenarios */
const fallbackNames = {
  //  "station-001": "Suzzallo Library Station",
  //  "station-002": "The HUB",
  //  "station-003": "Kane Hall Station",
  //  "station-004": "North Campus Station",
  //  "station-005": "Red Square Station",
  //  "fuzzball_01": "Suzzallo Library Station",
  //  "station-hub": "The HUB",
  //  "fuzzball_02": "The HUB South",
};

const fallbackAddresses = {
  // "station-001": "411 Library Way, Seattle, WA 98195",
  // "station-002": "HUB, Seattle, WA 98195",
  // "station-003": "Kane Hall, Seattle, WA 98195",
  // "station-004": "North Campus, Seattle, WA 98195",
  // "station-005": "Red Square, Seattle, WA 98195",
};

/**
 * Fetch and cache station data from the API.
 * Returns cached data on subsequent calls.
 * @returns {Promise<Array>} Array of station objects
 */
async function fetchStationData() {
  // Return cached data if available
  if (stationCache) {
    return stationCache;
  }

  // Return pending promise if already fetching
  if (stationCachePromise) {
    return stationCachePromise;
  }

  // Start fetching
  stationCachePromise = (async () => {
    try {
      const response = await api.getStations();
      const stations = response.stations || [];
      stationCache = stations;
      return stations;
    } catch (error) {
      console.warn("Failed to fetch stations from API:", error);
      // Return empty array on error; will use fallback names
      return [];
    } finally {
      stationCachePromise = null;
    }
  })();

  return stationCachePromise;
}

/**
 * Get station display name from API data or fallback
 * @param {string} stationId
 * @returns {string}
 */
export function getStationDisplayName(stationId) {
  if (!stationId) return "Station";

  // Check cache first
  if (stationCache) {
    const station = stationCache.find((s) => s.stationId === stationId);
    if (station && station.name) {
      return station.name;
    }
  }

  // Fall back to hard-coded names
  return fallbackNames[stationId] || `Station ${stationId}`;
}

/**
 * Get station address from API data or fallback
 * @param {string} stationId
 * @returns {string}
 */
export function getStationAddress(stationId) {
  if (!stationId) return "";

  // Check cache first
  if (stationCache) {
    const station = stationCache.find((s) => s.stationId === stationId);
    if (station && station.address) {
      return station.address;
    }
  }

  // Fall back to hard-coded addresses
  return fallbackAddresses[stationId] || "";
}

/**
 * Eagerly load station data (call this at app startup to populate cache)
 * @returns {Promise<void>}
 */
export async function preloadStationData() {
  try {
    await fetchStationData();
  } catch (error) {
    console.warn("Failed to preload station data:", error);
  }
}

/**
 * Get a specific station object from cache (or fetch if not cached)
 * @param {string} stationId
 * @returns {Promise<Object|null>}
 */
export async function getStationDetails(stationId) {
  if (!stationId) return null;

  const stations = await fetchStationData();
  return stations.find((s) => s.stationId === stationId) || null;
}

/**
 * Get all cached station data (fetches if not already cached)
 * @returns {Promise<Array>}
 */
export async function getAllStations() {
  return fetchStationData();
}

// Automatically preload on import if in browser environment
if (typeof window !== "undefined") {
  // Don't await; let it load in background
  preloadStationData().catch(() => {});
}

