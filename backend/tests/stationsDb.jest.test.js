/**
 * Stations DB tests.
 */

const stationsDb = require("../src/db/stations");

jest.mock("../src/db", () => ({
  getPool: jest.fn(),
  query: jest.fn(),
}));

const db = require("../src/db");

describe("stationsDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByStationId", () => {
    test("returns null when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const result = await stationsDb.getByStationId("station-1");
      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    test("returns station data when found", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({
        rows: [{
          station_id: "station-1",
          station_name: "Test Station",
          capacity: 10,
          num_brellas: 5,
          status: "operational",
          latitude: 45.0,
          longitude: -122.0
        }]
      });
      const result = await stationsDb.getByStationId("station-1");
      expect(db.query).toHaveBeenCalledWith(
        "SELECT station_id, station_name, capacity, num_brellas, status, latitude, longitude FROM stations WHERE station_id = $1",
        ["station-1"]
      );
      expect(result).toEqual({
        station_id: "station-1",
        station_name: "Test Station",
        capacity: 10,
        num_brellas: 5,
        status: "operational",
        latitude: 45.0,
        longitude: -122.0,
        name: "Test Station"
      });
    });

    test("returns null when not found", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [] });
      const result = await stationsDb.getByStationId("station-1");
      expect(result).toBeNull();
    });
  });

  describe("listStations", () => {
    test("returns empty array when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const result = await stationsDb.listStations();
      expect(result).toEqual([]);
      expect(db.query).not.toHaveBeenCalled();
    });

    test("returns list of stations", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({
        rows: [
          {
            station_id: "station-1",
            station_name: "Station 1",
            latitude: 45.0,
            longitude: -122.0,
            capacity: 10,
            num_brellas: 5,
            status: "operational"
          }
        ]
      });
      const result = await stationsDb.listStations();
      expect(result).toEqual([{
        station_id: "station-1",
        station_name: "Station 1",
        latitude: 45.0,
        longitude: -122.0,
        capacity: 10,
        num_brellas: 5,
        status: "operational",
        name: "Station 1"
      }]);
    });
  });

  describe("upsertStation", () => {
    test("returns null when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const result = await stationsDb.upsertStation({
        stationId: "station-1",
        capacity: 10
      });
      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    test("upserts station successfully", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({
        rows: [{
          station_id: "station-1",
          station_name: "Station 1",
          latitude: 45.0,
          longitude: -122.0,
          capacity: 10,
          num_brellas: 10,
          status: "operational"
        }]
      });
      const result = await stationsDb.upsertStation({
        stationId: "station-1",
        name: "Station 1",
        latitude: 45.0,
        longitude: -122.0,
        capacity: 10,
        status: "operational"
      });
      expect(result).toEqual({
        station_id: "station-1",
        station_name: "Station 1",
        latitude: 45.0,
        longitude: -122.0,
        capacity: 10,
        num_brellas: 10,
        status: "operational",
        name: "Station 1"
      });
    });
  });

  describe("decrementNumBrellas", () => {
    test("does nothing when no pool", async () => {
      db.getPool.mockReturnValue(null);
      await stationsDb.decrementNumBrellas("station-1");
      expect(db.query).not.toHaveBeenCalled();
    });

    test("decrements num_brellas", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue();
      await stationsDb.decrementNumBrellas("station-1");
      expect(db.query).toHaveBeenCalledWith(
        "UPDATE stations SET num_brellas = GREATEST(0, num_brellas - 1) WHERE station_id = $1",
        ["station-1"]
      );
    });
  });

  describe("incrementNumBrellas", () => {
    test("does nothing when no pool", async () => {
      db.getPool.mockReturnValue(null);
      await stationsDb.incrementNumBrellas("station-1");
      expect(db.query).not.toHaveBeenCalled();
    });

    test("increments num_brellas", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue();
      await stationsDb.incrementNumBrellas("station-1");
      expect(db.query).toHaveBeenCalledWith(
        "UPDATE stations SET num_brellas = LEAST(capacity, num_brellas + 1) WHERE station_id = $1",
        ["station-1"]
      );
    });
  });

  describe("updateStatus", () => {
    test("returns null when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const result = await stationsDb.updateStatus("station-1", "maintenance");
      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    test("updates status successfully", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({
        rows: [{
          station_id: "station-1",
          station_name: "Station 1",
          capacity: 10,
          num_brellas: 5,
          status: "maintenance"
        }]
      });
      const result = await stationsDb.updateStatus("station-1", "maintenance");
      expect(result).toEqual({
        station_id: "station-1",
        station_name: "Station 1",
        capacity: 10,
        num_brellas: 5,
        status: "maintenance",
        name: "Station 1"
      });
    });

    test("returns null when station not found", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [] });
      const result = await stationsDb.updateStatus("station-1", "maintenance");
      expect(result).toBeNull();
    });
  });
});