/**
 * Comprehensive tests for the admin router (src/routes/admin.js).
 *
 * Because this module is large we re-require it in each test to allow changing
 * the mocked configuration values between scenarios.
 */

const request = require("supertest");
const express = require("express");

// setup all the mocks used by admin.js
jest.mock("../../src/db", () => ({ query: jest.fn() }));
jest.mock("../../src/db/config", () => ({ get: jest.fn(), set: jest.fn() }));
jest.mock("../../src/businessLogic/reportLogic", () => ({ listAll: jest.fn(), resolve: jest.fn() }));
jest.mock("../../src/store/getRentalStore", () => jest.fn());
jest.mock("../../src/store/supportRequestStoreDb", () => ({ listAllForAdmin: jest.fn(), resolve: jest.fn() }));
jest.mock("../../src/services/stationAdminService", () => ({
  createOrUpdateStation: jest.fn(),
  updateStationStatus: jest.fn(),
  updateStation: jest.fn(),
  deleteStation: jest.fn(),
}));
jest.mock("../../src/services/rentalTrendService", () => ({ getRentalTrends: jest.fn() }));
jest.mock("../../src/services/appContentService", () => ({
  getContent: jest.fn(),
  updateContent: jest.fn(),
}));
// config object is simple; we'll mutate it directly during tests
jest.mock("../../src/config", () => ({}));

// when rental store factory is called we give back an object we can manipulate
const makeStore = () => ({
  listBySession: jest.fn(),
  countBySession: jest.fn(),
  countActiveRentals: jest.fn(),
  listRecentForAdmin: jest.fn(),
});

let db, config, reportLogic, getRentalStore, supportRequestStore;
let stationAdminService, rentalTrendService, appContentService, configDb;
let router;

function createApp() {
  const app = express();
  app.use(express.json());
  // attach dummy adminUserId middleware for endpoints that use it
  app.use((req, _res, next) => {
    req.adminUserId = "admin-1";
    next();
  });
  app.use(router);
  return app;
}

describe("admin router", () => {
  beforeEach(() => {
    jest.resetModules();
    db = require("../../src/db");
    config = require("../../src/config");
    reportLogic = require("../../src/businessLogic/reportLogic");
    getRentalStore = require("../../src/store/getRentalStore");
    supportRequestStore = require("../../src/store/supportRequestStoreDb");
    stationAdminService = require("../../src/services/stationAdminService");
    rentalTrendService = require("../../src/services/rentalTrendService");
    appContentService = require("../../src/services/appContentService");
    configDb = require("../../src/db/config");
    router = require("../../src/routes/admin");
  });

  describe("GET /stats", () => {
    test("returns defaults when no database URL and query throws", async () => {
      config.databaseUrl = undefined;
      db.query.mockImplementation(() => { throw new Error("nope"); });
      reportLogic.listAll.mockReturnValue([]);
      const app = createApp();
      const res = await request(app).get("/stats");
      expect(res.body).toMatchObject({
        usersCount: 0,
        activeRentalsCount: 0,
        reportsCount: 0,
        openReportsCount: 0,
      });
    });

    test("includes values when database available and store returns counts", async () => {
      config.databaseUrl = "postgres://db";
      // profile count query
      db.query.mockResolvedValueOnce({ rows: [{ count: 7 }] });
      // station sum query
      db.query.mockResolvedValueOnce({ rows: [{ total_capacity: 10, total_available: 4 }] });
      // rental store
      const store = makeStore();
      store.countActiveRentals.mockResolvedValue(3);
      getRentalStore.mockReturnValue(store);
      reportLogic.listAll.mockReturnValue([{ createdAt: 1 }, { createdAt: 2 }]);
      supportRequestStore.listAllForAdmin.mockResolvedValue([{ createdAt: 3 }]);

      const app = createApp();
      const res = await request(app).get("/stats");
      expect(res.body.usersCount).toBe(7);
      expect(res.body.activeRentalsCount).toBe(3);
      expect(res.body.totalUmbrellas).toBe(4);
      expect(res.body.activeSessions).toBe(6);
      expect(res.body.reportsCount).toBe(3);
    });

    test("falls back when support store throws", async () => {
      config.databaseUrl = "yes";
      reportLogic.listAll.mockReturnValue([{ createdAt: 5 }]);
      supportRequestStore.listAllForAdmin.mockRejectedValue(new Error("boom"));
      const app = createApp();
      const res = await request(app).get("/stats");
      expect(res.body.reportsCount).toBe(1);
    });
  });

  describe("GET /users", () => {
    test("returns list when query succeeds", async () => {
      db.query.mockResolvedValue({ rows: [{ id: "u", email: null, full_name: "N", role: null }] });
      const app = createApp();
      const res = await request(app).get("/users");
      expect(res.body.users[0]).toMatchObject({ id: "u", email: "", full_name: "N", role: "user" });
    });

    test("errors propagate", async () => {
      db.query.mockRejectedValue(new Error("fail"));
      const app = createApp();
      const res = await request(app).get("/users");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /activity", () => {
    test("returns empty when no DB", async () => {
      config.databaseUrl = undefined;
      const app = createApp();
      const res = await request(app).get("/activity");
      expect(res.body.activities).toEqual([]);
    });

    test("returns results when store works", async () => {
      config.databaseUrl = "foo";
      const store = makeStore();
      store.listRecentForAdmin.mockResolvedValue([1, 2]);
      getRentalStore.mockReturnValue(store);
      const app = createApp();
      const res = await request(app).get("/activity?limit=10");
      expect(res.body.activities).toEqual([1, 2]);
    });

    test("store error returns empty array", async () => {
      config.databaseUrl = "foo";
      const store = makeStore();
      store.listRecentForAdmin.mockRejectedValue(new Error("err"));
      getRentalStore.mockReturnValue(store);
      const app = createApp();
      const res = await request(app).get("/activity");
      expect(res.body.activities).toEqual([]);
    });
  });

  describe("GET /trends", () => {
    test("forwards to rentalTrendService", async () => {
      rentalTrendService.getRentalTrends.mockResolvedValue({ chart: true });
      const app = createApp();
      const res = await request(app).get("/trends?hours=5");
      expect(res.body).toEqual({ chart: true });
      expect(rentalTrendService.getRentalTrends).toHaveBeenCalledWith({ hours: "5" });
    });
  });

  describe("GET /reports", () => {
    test("returns combined reports", async () => {
      reportLogic.listAll.mockReturnValue([{ createdAt: 1 }]);
      // ensure DB path is taken
      config.databaseUrl = "yes";
      supportRequestStore.listAllForAdmin.mockResolvedValue([{ createdAt: 2 }]);
      const app = createApp();
      const res = await request(app).get("/reports");
      expect(res.body.reports.length).toBe(2);
    });
  });

  describe("content endpoints", () => {
    test("GET success", async () => {
      const doc = { a: 1 };
      appContentService.getContent.mockResolvedValue(doc);
      const app = createApp();
      const res = await request(app).get("/content/foo");
      expect(res.body).toEqual(doc);
    });
    test("GET 404", async () => {
      const err = new Error("no"); err.statusCode = 404;
      appContentService.getContent.mockRejectedValue(err);
      const app = createApp();
      const res = await request(app).get("/content/foo");
      expect(res.status).toBe(404);
    });

    test("PUT updates and returns object", async () => {
      const updated = { b: 2 };
      appContentService.updateContent.mockResolvedValue(updated);
      const app = createApp();
      const res = await request(app)
        .put("/content/foo")
        .send({ document: {} });
      expect(res.body).toEqual(updated);
    });

    test("PUT validation error returns 400", async () => {
      const err = new Error("required field");
      appContentService.updateContent.mockRejectedValue(err);
      const app = createApp();
      const res = await request(app)
        .put("/content/foo")
        .send({ document: {} });
      expect(res.status).toBe(400);
    });

    test("PUT 404 branch", async () => {
      const err = new Error("not found"); err.statusCode = 404;
      appContentService.updateContent.mockRejectedValue(err);
      const app = createApp();
      const res = await request(app)
        .put("/content/foo")
        .send({ document: {} });
      expect(res.status).toBe(404);
    });

    test("PUT table missing returns 503", async () => {
      const err = new Error("dummy"); err.code = "42P01";
      appContentService.updateContent.mockRejectedValue(err);
      const app = createApp();
      const res = await request(app)
        .put("/content/foo")
        .send({ document: {} });
      expect(res.status).toBe(503);
    });
  });

  describe("POST /reports/:id/resolve", () => {
    test("fallback to reportLogic when no DB", async () => {
      config.databaseUrl = undefined;
      reportLogic.resolve.mockReturnValue({ id: "x" });
      const app = createApp();
      const res = await request(app).post("/reports/123/resolve");
      expect(res.body.report).toEqual({ id: "x" });
    });

    test("404 when resolve returns null", async () => {
      config.databaseUrl = undefined;
      reportLogic.resolve.mockReturnValue(null);
      const app = createApp();
      const res = await request(app).post("/reports/123/resolve");
      expect(res.status).toBe(404);
    });
  });

  describe("station management endpoints", () => {
    test("GET /stations returns rows", async () => {
      jest.mock("../../src/db/stations", () => ({ listStations: jest.fn().mockResolvedValue([{ station_id: "1" }]) }));
      const app = createApp();
      const res = await request(app).get("/stations");
      expect(res.body.stations[0].stationId).toBe("1");
    });

    test("GET /stations handles errors", async () => {
      jest.mock("../../src/db/stations", () => ({ listStations: jest.fn().mockRejectedValue(new Error("no")) }));
      const app = createApp();
      const res = await request(app).get("/stations");
      expect(res.body.stations).toEqual([]);
    });

    test("POST /stations creates and returns 201", async () => {
      stationAdminService.createOrUpdateStation.mockResolvedValue({ station_id: "s" });
      const app = createApp();
      const res = await request(app)
        .post("/stations")
        .send({ stationId: "s", capacity: 5 });
      expect(res.status).toBe(201);
      expect(res.body.station.stationId).toBe("s");
    });

    test("POST /stations validation error", async () => {
      stationAdminService.createOrUpdateStation.mockRejectedValue(new Error("must be"));
      const app = createApp();
      const res = await request(app)
        .post("/stations")
        .send({ stationId: "", capacity: 0 });
      expect(res.status).toBe(400);
    });

    test("PATCH /stations/:id updates status", async () => {
      stationAdminService.updateStationStatus.mockResolvedValue({ station_id: "x", status: "ok" });
      const app = createApp();
      const res = await request(app)
        .patch("/stations/xyz")
        .send({ status: "ok" });
      expect(res.body.station.status).toBe("ok");
    });

    test("PATCH /stations/:id 404", async () => {
      const err = new Error("not"); err.statusCode = 404;
      stationAdminService.updateStationStatus.mockRejectedValue(err);
      const app = createApp();
      const res = await request(app)
        .patch("/stations/xyz")
        .send({ status: "ok" });
      expect(res.status).toBe(404);
    });

    test("DELETE /stations/:id returns 204 or handles not found", async () => {
      stationAdminService.deleteStation.mockResolvedValue();
      let app = createApp();
      let res = await request(app).delete("/stations/abc");
      expect(res.status).toBe(204);

      stationAdminService.deleteStation.mockRejectedValue(Object.assign(new Error("not"), { statusCode: 404 }));
      app = createApp();
      res = await request(app).delete("/stations/abc");
      expect(res.status).toBe(404);
    });
  });

  describe("pricing endpoints", () => {
    test("GET returns parsed ints", async () => {
      configDb.get.mockResolvedValueOnce("200").mockResolvedValueOnce("20");
      const app = createApp();
      const res = await request(app).get("/pricing");
      expect(res.body).toEqual({ unlockFeeCents: 200, centsPerMinute: 20 });
    });

    test("PUT validates and updates", async () => {
      configDb.set.mockResolvedValue();
      const app = createApp();
      const res = await request(app)
        .put("/pricing")
        .send({ unlockFeeCents: 10, centsPerMinute: 5 });
      expect(res.body).toEqual({ unlockFeeCents: 10, centsPerMinute: 5 });
    });

    test("PUT rejects bad values", async () => {
      const app = createApp();
      let res = await request(app)
        .put("/pricing")
        .send({ unlockFeeCents: -1, centsPerMinute: 5 });
      expect(res.status).toBe(400);

      res = await request(app)
        .put("/pricing")
        .send({ unlockFeeCents: 1, centsPerMinute: -2 });
      expect(res.status).toBe(400);
    });
  });
});
