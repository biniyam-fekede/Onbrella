// creates a map to store station data
// Each station is a key that is mapped to specific metadata about that station
// stationId -> { stationId, capacity, availableSlots }
const stationMap = new Map();

// validate that station ID is a non-empty string
function validateStationId(id) {
  if (id == null || id === "") throw new Error("stationId is required");
}
// validate that a station capacity is a positive integer
function validateCapacity(capacity) {
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error("capacity must be a positive integer");
}

// validate that there are umbrellas available (slots that contain umbrellas)
function validateAvailable(umbrellasAvailable) {
  if (!Number.isInteger(umbrellasAvailable) || umbrellasAvailable < 0) throw new Error("umbrellasAvailable must be a non-negative integer");
}

// creates a station with the given ID, capacity, and umbrellas available at that station. Validates inputs and stores in the data map.
function createStation(stationId, capacity, umbrellasAvailable) {
  // call the helper methods from above for validation, also check duplicate stations and capacity
  validateStationId(stationId);
  validateCapacity(capacity);
  validateAvailable(umbrellasAvailable);
  if (umbrellasAvailable > capacity) throw new Error("umbrellasAvailable cannot exceed capacity");
  if (stationMap.has(String(stationId))) throw new Error("Station already exists");

  const station = { stationId: String(stationId), capacity, umbrellasAvailable };
  stationMap.set(station.stationId, station);
  return station;
}

// getter method to access stations using the station ID
function getStation(stationId) {
  validateStationId(stationId);
  return stationMap.get(String(stationId));
}

// gives us a list of all the stations in the staion map
function listStations() {
  return Array.from(stationMap.values());
}

// call this method to decrement the number of umbrellas available
// at a station when a user rents an umbrella
function decrementUmbrellasAvailable(stationId) {
  const station = getStation(stationId);
  if (!station) throw new Error("Station not found");
  if (station.umbrellasAvailable <= 0) throw new Error("No available umbrellas");
  station.umbrellasAvailable -= 1;
  return station;
}

// call this method to increment the number of available umbrellas
// at a station when a user returns an umbrella
function incrementUmbrellasAvailable(stationId) {
  const station = getStation(stationId);
  if (!station) throw new Error("Station not found");
  if (station.umbrellasAvailable >= station.capacity) throw new Error("Station is full");
  station.umbrellasAvailable += 1;
  return station;
}

function clear() {
  stationMap.clear();
}

module.exports = {
  createStation,
  getStation,
  listStations,
  decrementUmbrellasAvailable,
  incrementUmbrellasAvailable,
  clear,
};