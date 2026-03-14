const express = require("express");
const request = require("supertest");

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

jest.mock("../src/db/stations", () => ({
  listStations: jest.fn(),
}));

jest.mock("../src/services/stationAdminService", () => ({
  createOrUpdateStation: jest.fn(),
  updateStationStatus: jest.fn(),
  updateStation: jest.fn(),
  deleteStation: jest.fn(),
}));

const db = require("../src/db");
const stationsDb = require("../src/db/stations");
const stationAdminService = require("../src/services/stationAdminService");
const adminRouter = require("../src/routes/admin");

/** App with no auth; req.adminLocationIds etc. are undefined (all stations). */
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminRouter);
  return app;
}

/** App with location-scoped admin: req.adminLocationIds and req.isSuperAdmin set before router. */
function createAppWithLocationScopedAdmin(locationIds = ["loc-uuid-1"]) {
  const app = express();
  app.use(express.json());
  app.use("/api/admin", (req, _res, next) => {
    req.adminLocationIds = locationIds;
    req.adminLocationId = locationIds[0] ?? null;
    req.isSuperAdmin = false;
    next();
  });
  app.use("/api/admin", adminRouter);
  return app;
}

describe("admin station routes", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue({ rows: [{ exists: false }] });
  });

  test("GET /api/admin/stations returns DB-backed stations", async () => {
    stationsDb.listStations.mockResolvedValue([
      {
        station_id: "station-001",
        name: null,
        latitude: 47.6553,
        longitude: -122.3035,
        capacity: 10,
        num_brellas: 7,
        status: "operational",
      },
    ]);

    const res = await request(app).get("/api/admin/stations");

    expect(res.status).toBe(200);
    expect(res.body.stations).toHaveLength(1);
    expect(res.body.stations[0].stationId).toBe("station-001");
  });

  test("POST /api/admin/stations upserts a station", async () => {
    stationAdminService.createOrUpdateStation.mockResolvedValue({
      station_id: "station-009",
      name: null,
      latitude: 47.6,
      longitude: -122.3,
      capacity: 12,
      num_brellas: 12,
      status: "operational",
    });

    const res = await request(app).post("/api/admin/stations").send({
      stationId: "station-009",
      latitude: 47.6,
      longitude: -122.3,
      capacity: 12,
    });

    expect(res.status).toBe(201);
    expect(stationAdminService.createOrUpdateStation).toHaveBeenCalledWith(
      {
        stationId: "station-009",
        latitude: 47.6,
        longitude: -122.3,
        capacity: 12,
      },
      { adminLocationId: null, adminLocationIds: [], isSuperAdmin: false }
    );
    expect(res.body.station.stationId).toBe("station-009");
  });

  test("PATCH /api/admin/stations/:stationId updates station status", async () => {
    stationAdminService.updateStationStatus.mockResolvedValue({
      station_id: "station-001",
      name: null,
      capacity: 10,
      num_brellas: 7,
      status: "maintenance",
    });

    const res = await request(app).patch("/api/admin/stations/station-001").send({
      status: "maintenance",
    });

    expect(res.status).toBe(200);
    expect(stationAdminService.updateStationStatus).toHaveBeenCalledWith(
      "station-001",
      "maintenance",
      { adminLocationId: null, adminLocationIds: [], isSuperAdmin: false }
    );
    expect(res.body.station.status).toBe("maintenance");
  });

  test("PUT /api/admin/stations/:stationId updates station details", async () => {
    stationAdminService.updateStation.mockResolvedValue({
      station_id: "station-001",
      stationId: "station-001",
      name: null,
      latitude: 47.6553,
      longitude: -122.3035,
      capacity: 8,
      num_brellas: 6,
      status: "maintenance",
    });

    const res = await request(app).put("/api/admin/stations/station-001").send({
      capacity: 8,
      status: "maintenance",
    });

    expect(res.status).toBe(200);
    expect(stationAdminService.updateStation).toHaveBeenCalledWith(
      "station-001",
      { capacity: 8, status: "maintenance" },
      { adminLocationId: null, adminLocationIds: [], isSuperAdmin: false }
    );
    expect(res.body.station).toEqual({
      stationId: "station-001",
      name: null,
      latitude: 47.6553,
      longitude: -122.3035,
      capacity: 8,
      numUmbrellas: 6,
      status: "maintenance",
    });
  });
});

describe("admin location-scoping (stations and stats filtered by admin_location_assignments)", () => {
  const locationIds = ["a0000001-b000-4000-8000-000000000001"];

  test("GET /api/admin/stations with location-scoped admin calls listStations with locationIds", async () => {
    const app = createAppWithLocationScopedAdmin(locationIds);
    stationsDb.listStations.mockResolvedValue([
      {
        station_id: "station-001",
        name: "UW Station",
        latitude: 47.6553,
        longitude: -122.3035,
        capacity: 10,
        num_brellas: 7,
        status: "operational",
      },
    ]);

    const res = await request(app).get("/api/admin/stations");

    expect(res.status).toBe(200);
    expect(stationsDb.listStations).toHaveBeenCalledWith({ locationIds });
    expect(res.body.stations).toHaveLength(1);
    expect(res.body.stations[0].stationId).toBe("station-001");
  });

  test("GET /api/admin/stats with location-scoped admin returns totalCapacity and X-Admin-Location-Scoped header", async () => {
    const app = createAppWithLocationScopedAdmin(locationIds);
    db.query.mockResolvedValue({ rows: [{ count: 3 }] });

    const res = await request(app).get("/api/admin/stats");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalCapacity");
    expect(res.headers["x-admin-location-scoped"]).toBe("true");
  });
});
