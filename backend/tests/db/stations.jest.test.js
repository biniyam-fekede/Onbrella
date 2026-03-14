/**
 * Unit tests for src/db/stations.js.  Mocks the generic db module to exercise
 * behavior when the pool is missing, when queries return data or not, and
 * verifies that helper functions map the returned rows to include a `name` field.
 */

// mock the entire db helper so we can control getPool() and query()
jest.mock("../../src/db", () => ({
  getPool: jest.fn(),
  query: jest.fn(),
}));

const db = require("../../src/db");
const stations = require("../../src/db/stations");

// helper row used in many tests
const sampleRow = {
  station_id: "s1",
  station_name: "Station One",
  capacity: 42,
  num_brellas: 10,
  status: "operational",
  latitude: 47.6,
  longitude: -122.3,
};

describe("db/stations", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getByStationId", () => {
    test("returns null when pool not configured", async () => {
      db.getPool.mockReturnValue(null);
      const result = await stations.getByStationId("foo");
      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    test("returns null when query returns no rows", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [] });
      const result = await stations.getByStationId("foo");
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT station_id"),
        ["foo"]
      );
    });

    test("maps row and adds name property", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [sampleRow] });
      const result = await stations.getByStationId("s1");
      expect(result).toEqual({ ...sampleRow, name: sampleRow.station_name });
    });
  });

  describe("listStations", () => {
    test("returns empty array when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const res = await stations.listStations();
      expect(res).toEqual([]);
    });

    test("returns transformed rows when pool present", async () => {
      db.getPool.mockReturnValue({});
      const rows = [sampleRow, { ...sampleRow, station_id: "s2", station_name: "B" }];
      db.query.mockResolvedValue({ rows });
      const res = await stations.listStations();
      expect(res).toEqual(rows.map(r => ({ ...r, name: r.station_name })));
      // query is called with only the SQL string; parameters are omitted
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY station_id")
      );
    });
  });

  describe("upsertStation", () => {
    const opts = { stationId: "x", name: "  spaced  ", latitude: 1, longitude: 2, capacity: 5, status: "out_of_service" };

    test("returns null when pool missing", async () => {
      db.getPool.mockReturnValue(null);
      const res = await stations.upsertStation(opts);
      expect(res).toBeNull();
    });

    test("trims empty name to null and returns row", async () => {
      db.getPool.mockReturnValue({});
      const out = { ...sampleRow };
      db.query.mockResolvedValue({ rows: [out] });
      const res = await stations.upsertStation({ ...opts, name: "   " });
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([opts.stationId, null, opts.latitude, opts.longitude, opts.capacity, opts.status])
      );
      expect(res).toEqual({ ...out, name: out.station_name });
    });

    test("returns null when query yields no rows", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [] });
      const res = await stations.upsertStation(opts);
      expect(res).toBeNull();
    });
  });

  describe("increment/decrement num brellas", () => {
    test("no-op when pool missing", async () => {
      db.getPool.mockReturnValue(null);
      await stations.decrementNumBrellas("id");
      await stations.incrementNumBrellas("id");
      expect(db.query).not.toHaveBeenCalled();
    });

    test("calls query when pool present", async () => {
      db.getPool.mockReturnValue({});
      await stations.decrementNumBrellas("id1");
      await stations.incrementNumBrellas("id2");
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("GREATEST(0"),
        ["id1"]
      );
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("LEAST(capacity"),
        ["id2"]
      );
    });
  });

  describe("updateStatus", () => {
    test("returns null when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const r = await stations.updateStatus("x", "maintenance");
      expect(r).toBeNull();
    });

    test("returns mapped row when one exists", async () => {
      db.getPool.mockReturnValue({});
      const row = { ...sampleRow };
      db.query.mockResolvedValue({ rows: [row] });
      const r = await stations.updateStatus("x", "out_of_service");
      expect(r).toEqual({ ...row, name: row.station_name });
    });

    test("returns null when update affected nothing", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [] });
      const r = await stations.updateStatus("x", "out_of_service");
      expect(r).toBeNull();
    });
  });

  describe("updateStation", () => {
    test("returns null when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const r = await stations.updateStation("x", { name: "n" });
      expect(r).toBeNull();
    });

    test("returns getByStationId result when opts empty", async () => {
      db.getPool.mockReturnValue({});
      // simulate the underlying query used by getByStationId
      db.query.mockResolvedValue({ rows: [{ station_id: "x", station_name: "abc" }] });
      const r = await stations.updateStation("x", {});
      expect(r).toEqual({ station_id: "x", station_name: "abc", name: "abc" });
    });

    test("updates only supplied fields and maps name", async () => {
      db.getPool.mockReturnValue({});
      const returned = { ...sampleRow, station_name: "newname" };
      db.query.mockResolvedValue({ rows: [returned] });
      const r = await stations.updateStation("s1", { name: "newname", capacity: 99, status: "maintenance" });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("station_name"),
        expect.arrayContaining(["newname", 99, 99, "maintenance", "s1"])
      );
      expect(r).toEqual({ ...returned, name: returned.station_name });
    });

    test("updates latitude/longitude only", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [sampleRow] });
      const r = await stations.updateStation("s1", { latitude: 1.2, longitude: 3.4 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("latitude"),
        expect.arrayContaining([1.2, 3.4, "s1"])
      );
      expect(r).toEqual({ ...sampleRow, name: sampleRow.station_name });
    });

    test("returns null when update query returns no rows", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rows: [] });
      const r = await stations.updateStation("s1", { status: "out" });
      expect(r).toBeNull();
    });
  });

  describe("deleteStation", () => {
    test("returns false when no pool", async () => {
      db.getPool.mockReturnValue(null);
      const r = await stations.deleteStation("x");
      expect(r).toBe(false);
    });

    test("returns true when rowCount positive", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rowCount: 1 });
      const r = await stations.deleteStation("x");
      expect(r).toBe(true);
    });

    test("returns false when zero rows deleted", async () => {
      db.getPool.mockReturnValue({});
      db.query.mockResolvedValue({ rowCount: 0 });
      const r = await stations.deleteStation("x");
      expect(r).toBe(false);
    });
  });
});
