/**
 * Station validation tests.
 */

const {
  validateStationId,
  validateCapacity,
  validateLatLong,
  validateStatus,
  validateName,
  validateStationPayload,
} = require("../src/lib/stationValidation");

describe("stationValidation", () => {
  describe("validateStationId", () => {
    test("accepts valid stationId", () => {
      expect(validateStationId("station1")).toBe("station1");
    });

    test("throws on null", () => {
      expect(() => validateStationId(null)).toThrow("stationId is required and must be a string");
    });

    test("throws on non-string", () => {
      expect(() => validateStationId(123)).toThrow("stationId is required and must be a string");
    });

    test("throws on empty string", () => {
      expect(() => validateStationId("")).toThrow("stationId cannot be empty");
    });

    test("throws on whitespace only", () => {
      expect(() => validateStationId("   ")).toThrow("stationId cannot be empty");
    });

    test("throws on too long", () => {
      const longId = "a".repeat(129);
      expect(() => validateStationId(longId)).toThrow("stationId must be at most 128 characters");
    });

    test("trims whitespace", () => {
      expect(validateStationId("  station1  ")).toBe("station1");
    });
  });

  describe("validateCapacity", () => {
    test("accepts valid capacity", () => {
      expect(validateCapacity(10)).toBe(10);
    });

    test("accepts string number", () => {
      expect(validateCapacity("10")).toBe(10);
    });

    test("throws on non-integer", () => {
      expect(() => validateCapacity(10.5)).toThrow("capacity must be a positive integer");
    });

    test("throws on zero", () => {
      expect(() => validateCapacity(0)).toThrow("capacity must be a positive integer");
    });

    test("throws on negative", () => {
      expect(() => validateCapacity(-1)).toThrow("capacity must be a positive integer");
    });

    test("throws on too large", () => {
      expect(() => validateCapacity(10000)).toThrow("capacity must be at most 9999");
    });
  });

  describe("validateLatLong", () => {
    test("accepts valid latitude", () => {
      expect(validateLatLong(45, "latitude")).toBe(45);
    });

    test("accepts valid longitude", () => {
      expect(validateLatLong(-122, "longitude")).toBe(-122);
    });

    test("returns null for empty", () => {
      expect(validateLatLong("", "latitude")).toBeNull();
    });

    test("throws on invalid number", () => {
      expect(() => validateLatLong("abc", "latitude")).toThrow("latitude must be a number");
    });

    test("throws on latitude out of range", () => {
      expect(() => validateLatLong(91, "latitude")).toThrow("latitude must be between -90 and 90");
    });

    test("throws on longitude out of range", () => {
      expect(() => validateLatLong(181, "longitude")).toThrow("longitude must be between -180 and 180");
    });
  });

  describe("validateStatus", () => {
    test("accepts valid status", () => {
      expect(validateStatus("operational")).toBe("operational");
    });

    test("defaults to operational for empty", () => {
      expect(validateStatus("")).toBe("operational");
    });

    test("normalizes case", () => {
      expect(validateStatus("OUT_OF_SERVICE")).toBe("out_of_service");
    });

    test("throws on invalid status", () => {
      expect(() => validateStatus("invalid")).toThrow("status must be one of: operational, out_of_service, maintenance");
    });
  });

  describe("validateName", () => {
    test("accepts valid name", () => {
      expect(validateName("Station Name")).toBe("Station Name");
    });

    test("returns null for empty", () => {
      expect(validateName("")).toBeNull();
    });

    test("trims whitespace", () => {
      expect(validateName("  Name  ")).toBe("Name");
    });

    test("throws on too long", () => {
      const longName = "a".repeat(257);
      expect(() => validateName(longName)).toThrow("name must be at most 256 characters");
    });
  });

  describe("validateStationPayload", () => {
    test("validates complete payload", () => {
      const payload = {
        stationId: "station1",
        capacity: 10,
        name: "Test Station",
        latitude: 45,
        longitude: -122,
        status: "operational",
      };
      const result = validateStationPayload(payload);
      expect(result).toEqual({
        stationId: "station1",
        capacity: 10,
        name: "Test Station",
        latitude: 45,
        longitude: -122,
        status: "operational",
      });
    });

    test("handles optional fields", () => {
      const payload = {
        stationId: "station1",
        capacity: 10,
      };
      const result = validateStationPayload(payload);
      expect(result).toEqual({
        stationId: "station1",
        capacity: 10,
        name: null,
        latitude: null,
        longitude: null,
        status: "operational",
      });
    });
  });
});