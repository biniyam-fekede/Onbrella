/**
 * Station admin service tests.
 */

const stationAdminService = require("../src/services/stationAdminService");

jest.mock("../src/db/stations", () => ({
  upsertStation: jest.fn(),
  updateStatus: jest.fn(),
  updateStation: jest.fn(),
  deleteStation: jest.fn(),
}));

jest.mock("../src/db", () => ({
  getPool: jest.fn(),
}));

jest.mock("../src/services/hardwareClient", () => ({
  registerStation: jest.fn(),
}));

const stationsDb = require("../src/db/stations");
const db = require("../src/db");
const hardwareClient = require("../src/services/hardwareClient");

describe("stationAdminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.getPool.mockReturnValue({}); // Mock database as configured
  });

  describe("createOrUpdateStation", () => {
    test("creates or updates station successfully", async () => {
      const payload = {
        stationId: "station-1",
        capacity: 10,
        latitude: 47.6062,
        longitude: -122.3321,
        status: "operational",
      };
      const mockRow = { station_id: "station-1", capacity: 10 };
      stationsDb.upsertStation.mockResolvedValue(mockRow);
      hardwareClient.registerStation.mockResolvedValue();

      const result = await stationAdminService.createOrUpdateStation(payload);
      expect(stationsDb.upsertStation).toHaveBeenCalledWith({
        stationId: "station-1",
        capacity: 10,
        name: null,
        latitude: 47.6062,
        longitude: -122.3321,
        status: "operational",
        locationId: null,
      });
      expect(hardwareClient.registerStation).toHaveBeenCalledWith({
        stationId: "station-1",
        location: { latitude: 47.6062, longitude: -122.3321 },
        capacity: 10,
        status: "operational",
      });
      expect(result).toEqual(mockRow);
    });

    test("handles hardware client failure gracefully", async () => {
      const payload = { stationId: "station-1", capacity: 10 };
      const mockRow = { station_id: "station-1", capacity: 10 };
      stationsDb.upsertStation.mockResolvedValue(mockRow);
      hardwareClient.registerStation.mockRejectedValue(new Error("Hardware error"));

      const result = await stationAdminService.createOrUpdateStation(payload);
      expect(result).toEqual(mockRow); // Should still succeed
    });

    test("throws error when database not configured", async () => {
      db.getPool.mockReturnValue(null);
      await expect(stationAdminService.createOrUpdateStation({ stationId: "station-1", capacity: 10 }))
        .rejects.toThrow("Database not configured");
    });
  });

  describe("updateStationStatus", () => {
    test("updates station status successfully", async () => {
      const mockRow = { station_id: "station-1", status: "maintenance" };
      stationsDb.updateStatus.mockResolvedValue(mockRow);

      const result = await stationAdminService.updateStationStatus("station-1", "maintenance");
      expect(stationsDb.updateStatus).toHaveBeenCalledWith("station-1", "maintenance");
      expect(result).toEqual(mockRow);
    });

    test("throws 404 when station not found", async () => {
      stationsDb.updateStatus.mockResolvedValue(null);

      await expect(stationAdminService.updateStationStatus("station-1", "maintenance"))
        .rejects.toMatchObject({ statusCode: 404, message: "Station not found" });
    });

    test("throws error when database not configured", async () => {
      db.getPool.mockReturnValue(null);
      await expect(stationAdminService.updateStationStatus("station-1", "maintenance"))
        .rejects.toThrow("Database not configured");
    });
  });

  describe("updateStation", () => {
    test("updates station successfully", async () => {
      const body = { name: "New Name", capacity: 15 };
      const mockRow = { station_id: "station-1", name: "New Name", capacity: 15 };
      stationsDb.updateStation.mockResolvedValue(mockRow);

      const result = await stationAdminService.updateStation("station-1", body);
      expect(stationsDb.updateStation).toHaveBeenCalledWith("station-1", body);
      expect(result).toEqual(mockRow);
    });

    test("throws 404 when station not found", async () => {
      stationsDb.updateStation.mockResolvedValue(null);

      await expect(stationAdminService.updateStation("station-1", { capacity: 15 }))
        .rejects.toMatchObject({ statusCode: 404, message: "Station not found" });
    });

    test("throws error when database not configured", async () => {
      db.getPool.mockReturnValue(null);
      await expect(stationAdminService.updateStation("station-1", { capacity: 15 }))
        .rejects.toThrow("Database not configured");
    });
  });

  describe("deleteStation", () => {
    test("deletes station successfully", async () => {
      stationsDb.deleteStation.mockResolvedValue(true);

      const result = await stationAdminService.deleteStation("station-1");
      expect(stationsDb.deleteStation).toHaveBeenCalledWith("station-1");
      expect(result).toEqual({ deleted: true });
    });

    test("throws 404 when station not found", async () => {
      stationsDb.deleteStation.mockResolvedValue(false);

      await expect(stationAdminService.deleteStation("station-1"))
        .rejects.toMatchObject({ statusCode: 404, message: "Station not found" });
    });

    test("throws error when database not configured", async () => {
      db.getPool.mockReturnValue(null);
      await expect(stationAdminService.deleteStation("station-1"))
        .rejects.toThrow("Database not configured");
    });
  });
});