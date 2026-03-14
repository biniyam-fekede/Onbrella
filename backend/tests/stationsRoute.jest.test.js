/**
 * GET /api/stations route tests.
 * Covers: no-auth (all stations), location-scoped admin (filter by adminLocationIds), error fallback, X-Stations-Filter header.
 */

const express = require("express");
const request = require("supertest");

const rentalService = require("../src/services/rentalService");

jest.mock("../src/middleware/requireAdmin", () => ({
  requireAdmin: (req, res, next) => next(),
  optionalAdmin: (req, res, next) => next(),
}));

jest.mock("../src/services/rentalService", () => ({
  getStations: jest.fn().mockResolvedValue({ stations: [], totalStations: 0 }),
}));

const stationsRouter = require("../src/routes/stations");

function createApp(optionalAdminImpl) {
  const app = express();
  app.use(express.json());
  // Mount middleware then router: GET /api/stations hits router's GET /
  app.use(
    "/api/stations",
    optionalAdminImpl || ((req, res, next) => next()),
    stationsRouter
  );
  return app;
}

describe("GET /api/stations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rentalService.getStations.mockResolvedValue({
      stations: [{ stationId: "s1", location: { latitude: 47.6, longitude: -122.3 } }],
      totalStations: 1,
    });
  });

  test("without auth calls getStations with no location filter", async () => {
    const app = createApp();
    const res = await request(app).get("/api/stations");

    expect(res.status).toBe(200);
    expect(rentalService.getStations).toHaveBeenCalledWith({});
    expect(res.headers["x-stations-filter"]).toBe("all");
  });

  test("with location-scoped admin (req.adminLocationIds) calls getStations with locationIds", async () => {
    const locationIds = ["loc-uuid-1"];
    const app = createApp((req, res, next) => {
      req.adminLocationIds = locationIds;
      req.adminLocationId = locationIds[0];
      req.isSuperAdmin = false;
      next();
    });

    const res = await request(app).get("/api/stations");

    expect(res.status).toBe(200);
    expect(rentalService.getStations).toHaveBeenCalledWith({ locationIds });
    expect(res.headers["x-stations-filter"]).toBe("location-scoped");
  });

  test("on error returns empty list and X-Stations-Filter: all", async () => {
    rentalService.getStations.mockRejectedValueOnce(new Error("DB error"));
    const app = createApp();

    const res = await request(app).get("/api/stations");

    expect(res.status).toBe(200);
    expect(res.body.stations).toEqual([]);
    expect(res.body.totalStations).toBe(0);
    expect(res.headers["x-stations-filter"]).toBe("all");
  });
});
