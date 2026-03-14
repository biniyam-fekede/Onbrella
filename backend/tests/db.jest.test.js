/**
 * Database module tests.
 */

describe("db", () => {
  let db;
  let mockPool;
  let Pool;

  beforeEach(() => {
    jest.resetModules();
    // Mock pg
    const pg = require("pg");
    Pool = jest.fn();
    mockPool = {
      query: jest.fn(),
    };
    Pool.mockImplementation(() => mockPool);
    pg.Pool = Pool;

    db = require("../src/db");
  });

  describe("getPool", () => {
    test("returns null when databaseUrl is not set", () => {
      const config = require("../src/config");
      config.databaseUrl = null;
      const pool = db.getPool();
      expect(pool).toBeNull();
    });

    test("creates and returns pool when databaseUrl is set", () => {
      const config = require("../src/config");
      config.databaseUrl = "https://supabase-url";
      const pool = db.getPool();
      expect(Pool).toHaveBeenCalledWith({
        connectionString: "https://supabase-url",
        ssl: { rejectUnauthorized: false },
      });
      expect(pool).toBe(mockPool);
    });

    test("reuses existing pool", () => {
      const config = require("../src/config");
      config.databaseUrl = "https://supabase-url";
      db.getPool();
      db.getPool();
      expect(Pool).toHaveBeenCalledTimes(1);
    });
  });

  describe("query", () => {
    beforeEach(() => {
      const config = require("../src/config");
      config.databaseUrl = "mock-url";
    });

    test("throws error when pool is not available", async () => {
      const config = require("../src/config");
      config.databaseUrl = null;
      await expect(db.query("SELECT 1")).rejects.toThrow("Database not configured");
    });

    test("executes query successfully", async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const result = await db.query("SELECT 1", []);
      expect(mockPool.query).toHaveBeenCalledWith("SELECT 1", []);
      expect(result).toEqual({ rows: [], rowCount: 0 });
    });
  });

  describe("healthCheck", () => {
    test("returns false when pool is not available", async () => {
      const config = require("../src/config");
      config.databaseUrl = null;
      const result = await db.healthCheck();
      expect(result).toBe(false);
    });

    test("returns true when query succeeds", async () => {
      const config = require("../src/config");
      config.databaseUrl = "mock-url";
      mockPool.query.mockResolvedValue();
      const result = await db.healthCheck();
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith("SELECT 1");
    });

    test("returns false when query fails", async () => {
      const config = require("../src/config");
      config.databaseUrl = "mock-url";
      mockPool.query.mockRejectedValue(new Error("Connection failed"));
      const result = await db.healthCheck();
      expect(result).toBe(false);
    });
  });
});