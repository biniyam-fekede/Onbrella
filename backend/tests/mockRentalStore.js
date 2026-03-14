/**
 * In-memory mock for getRentalStore(). Used by tests so they don't need a real DB.
 */

function createMockRentalStore() {
  const rentals = new Map();
  const activeBySession = new Map();

  return {
    async getActiveBySession(sessionId) {
      const rentalId = activeBySession.get(sessionId);
      return rentalId ? rentals.get(rentalId) || null : null;
    },
    async getById(rentalId) {
      return rentals.get(rentalId) || null;
    },
    async create(sessionId, stationId, slotNumber) {
      const rentalId = `rental-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const umbrellaId = `umbrella-${stationId}-${slotNumber}`;
      const startTime = new Date().toISOString();
      const rental = {
        rentalId,
        sessionId,
        umbrellaId,
        stationId,
        slotNumber,
        startTime,
        status: "ACTIVE",
      };
      rentals.set(rentalId, rental);
      activeBySession.set(sessionId, rentalId);
      return { rentalId, umbrellaId, startTime };
    },
    async complete(rentalId, returnStationId, slotNumber) {
      const rental = rentals.get(rentalId);
      if (!rental || rental.status !== "ACTIVE") return null;
      const updated = {
        ...rental,
        status: "COMPLETED",
        endTime: new Date().toISOString(),
        returnStationId,
        returnSlotNumber: slotNumber,
      };
      rentals.set(rentalId, updated);
      activeBySession.delete(rental.sessionId);
      return updated;
    },
    clear() {
      rentals.clear();
      activeBySession.clear();
    },
  };
}

module.exports = { createMockRentalStore };
