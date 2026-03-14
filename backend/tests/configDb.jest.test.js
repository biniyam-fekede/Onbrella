/**
 * Config DB tests.
 */

const configDb = require("../src/db/config");

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const db = require("../src/db");

describe("configDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    test("returns value when key exists", async () => {
      db.query.mockResolvedValue({ rows: [{ value: "test-value" }] });
      const result = await configDb.get("test-key");
      expect(db.query).toHaveBeenCalledWith("SELECT value FROM config WHERE key = $1", ["test-key"]);
      expect(result).toBe("test-value");
    });

    test("returns null when key does not exist", async () => {
      db.query.mockResolvedValue({ rows: [] });
      const result = await configDb.get("nonexistent-key");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    test("sets a config value", async () => {
      db.query.mockResolvedValue();
      await configDb.set("test-key", "test-value");
      expect(db.query).toHaveBeenCalledWith(
        "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        ["test-key", "test-value"]
      );
    });
  });

  describe("getAll", () => {
    test("returns all config entries", async () => {
      const mockRows = [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" }
      ];
      db.query.mockResolvedValue({ rows: mockRows });
      const result = await configDb.getAll();
      expect(db.query).toHaveBeenCalledWith("SELECT key, value FROM config ORDER BY key");
      expect(result).toEqual(mockRows);
    });

    test("returns empty array when no config entries", async () => {
      db.query.mockResolvedValue({ rows: [] });
      const result = await configDb.getAll();
      expect(result).toEqual([]);
    });
  });
});