/**
 * Rental store DB tests.
 */

const rentalStoreDb = require("../src/store/rentalStoreDb");

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const db = require("../src/db");

describe("rentalStoreDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    test("creates a rental and returns details", async () => {
      db.query.mockResolvedValue();
      const result = await rentalStoreDb.create("session-1", "station-1", 5);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO rentals"),
        expect.any(Array)
      );
      expect(result).toHaveProperty("rentalId");
      expect(result).toHaveProperty("umbrellaId", "umbrella-station-1-5");
      expect(result).toHaveProperty("startTime");
    });
  });

  describe("complete", () => {
    test("completes a rental and returns updated rental", async () => {
      const mockRow = {
        rental_id: "rental-1",
        session_id: "session-1",
        umbrella_id: "umbrella-1",
        station_id: "station-1",
        slot_number: 5,
        start_time: new Date(),
        end_time: new Date(),
        return_station_id: "station-2",
        return_slot_number: 3,
        status: "COMPLETED",
      };
      db.query.mockResolvedValue({ rows: [mockRow] });
      const result = await rentalStoreDb.complete("rental-1", "station-2", 3);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE rentals"),
        ["rental-1", "station-2", 3]
      );
      expect(result).toHaveProperty("rentalId", "rental-1");
      expect(result).toHaveProperty("status", "COMPLETED");
    });

    test("returns null if no rental updated", async () => {
      db.query.mockResolvedValue({ rows: [] });
      const result = await rentalStoreDb.complete("rental-1", "station-2", 3);
      expect(result).toBeNull();
    });
  });

  describe("getActiveBySession", () => {
    test("returns active rental for session", async () => {
      const mockRow = {
        rental_id: "rental-1",
        session_id: "session-1",
        umbrella_id: "umbrella-1",
        station_id: "station-1",
        slot_number: 5,
        start_time: new Date(),
        status: "ACTIVE",
      };
      db.query.mockResolvedValue({ rows: [mockRow] });
      const result = await rentalStoreDb.getActiveBySession("session-1");
      expect(db.query).toHaveBeenCalledWith(
        `SELECT * FROM rentals WHERE session_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        ["session-1"]
      );
      expect(result).toHaveProperty("rentalId", "rental-1");
    });

    test("returns null if no active rental", async () => {
      db.query.mockResolvedValue({ rows: [] });
      const result = await rentalStoreDb.getActiveBySession("session-1");
      expect(result).toBeNull();
    });
  });

  describe("getById", () => {
    test("returns rental by id", async () => {
      const mockRow = {
        rental_id: "rental-1",
        session_id: "session-1",
        status: "ACTIVE",
      };
      db.query.mockResolvedValue({ rows: [mockRow] });
      const result = await rentalStoreDb.getById("rental-1");
      expect(db.query).toHaveBeenCalledWith(`SELECT * FROM rentals WHERE rental_id = $1`, ["rental-1"]);
      expect(result).toHaveProperty("rentalId", "rental-1");
    });

    test("returns null if not found", async () => {
      db.query.mockResolvedValue({ rows: [] });
      const result = await rentalStoreDb.getById("rental-1");
      expect(result).toBeNull();
    });
  });

  describe("listBySession", () => {
    test("lists completed rentals for session", async () => {
      const mockRows = [
        {
          rental_id: "rental-1",
          session_id: "session-1",
          status: "COMPLETED",
          start_time: new Date(),
        }
      ];
      db.query.mockResolvedValue({ rows: mockRows });
      const result = await rentalStoreDb.listBySession("session-1", { limit: 10, offset: 0 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM rentals"),
        ["session-1", 10, 0]
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("rentalId", "rental-1");
    });

    test("uses default limit and offset", async () => {
      db.query.mockResolvedValue({ rows: [] });
      await rentalStoreDb.listBySession("session-1");
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ["session-1", 20, 0]
      );
    });
  });

  describe("countBySession", () => {
    test("counts rentals for session", async () => {
      db.query.mockResolvedValue({ rows: [{ count: 5 }] });
      const result = await rentalStoreDb.countBySession("session-1");
      expect(db.query).toHaveBeenCalledWith(
        `SELECT COUNT(*)::int AS count FROM rentals WHERE session_id = $1`,
        ["session-1"]
      );
      expect(result).toBe(5);
    });
  });

  describe("countActiveRentals", () => {
    test("counts active rentals", async () => {
      db.query.mockResolvedValue({ rows: [{ count: 3 }] });
      const result = await rentalStoreDb.countActiveRentals();
      expect(db.query).toHaveBeenCalledWith(
        `SELECT COUNT(*)::int AS count FROM rentals WHERE status = 'ACTIVE'`
      );
      expect(result).toBe(3);
    });
  });

  describe("listRecentForAdmin", () => {
    test("lists recent rentals for admin", async () => {
      const mockRows = [
        {
          rental_id: "rental-1",
          session_id: "session-1",
          user_full_name: "John Doe",
          user_email: "john@example.com",
          start_time: new Date(),
          status: "COMPLETED",
        }
      ];
      db.query.mockResolvedValue({ rows: mockRows });
      const result = await rentalStoreDb.listRecentForAdmin(10);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("FROM rentals r"),
        [10]
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("userFullName", "John Doe");
    });
  });

  describe("listTrendBuckets", () => {
    test("lists trend buckets", async () => {
      const mockRows = [
        { bucket_start: new Date(), count: 5 }
      ];
      db.query.mockResolvedValue({ rows: mockRows });
      const result = await rentalStoreDb.listTrendBuckets(24);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WITH buckets AS"),
        [24]
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("count", 5);
    });
  });
});