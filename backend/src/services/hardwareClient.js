/**
 * Client for the hardware simulation layer (Mockoon mock or physical hardware).
 * Abstracts all hardware API calls. Swap implementation for real hardware later.
 */

const config = require("../config");

const BASE_URL = config.hardwareUrl;

/**
 * @returns {Promise<{stations: Array, totalStations: number}>}
 */
async function getStations() {
  let res;
  try {
    res = await fetch(`${BASE_URL}/hardware/stations`);
  } catch (e) {
    throw new HardwareError(
      "Stations service unavailable. Is the hardware mock running?",
      502
    );
  }
  if (!res.ok) {
    throw new HardwareError(`Hardware API error: ${res.status}`, res.status);
  }
  return res.json();
}

/**
 * Register or update a station with the hardware layer (optional).
 * If the hardware API does not support this (e.g. mock returns 404), the call fails silently
 * from the caller's perspective; the station is already persisted in the DB.
 * @param {object} station - { stationId, location?: { latitude, longitude }, capacity, status }
 * @returns {Promise<void>}
 */
async function registerStation(station) {
  const res = await fetch(`${BASE_URL}/hardware/stations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(station),
  });
  if (!res.ok) {
    throw new HardwareError(`Hardware register station: ${res.status}`, res.status);
  }
}

/**
 * @param {string} stationId
 * @param {number} slotNumber
 * @returns {Promise<{success: boolean, message: string, stationId: string, slotNumber: number}>}
 */
async function unlock(stationId) {
  const res = await fetch(`${BASE_URL}/hardware/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stationId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new HardwareError(data.message || `Unlock failed: ${res.status}`, res.status);
  }
  return data;
}

/**
 * @param {string} stationId
 * @param {number} slotNumber
 * @param {string} umbrellaId
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function returnUmbrella(stationId, umbrellaId) {
  const res = await fetch(`${BASE_URL}/hardware/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stationId, umbrellaId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new HardwareError(data.message || `Return failed: ${res.status}`, res.status);
  }
  return data;
}

class HardwareError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "HardwareError";
    this.statusCode = statusCode;
  }
}

module.exports = {
  getStations,
  registerStation,
  unlock,
  returnUmbrella,
  HardwareError,
};
