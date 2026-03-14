const express = require("express");
const request = require("supertest");

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

jest.mock("../src/store/getRentalStore", () => jest.fn(() => ({
  countActiveRentals: jest.fn().mockResolvedValue(0),
})));

jest.mock("../src/config", () => ({
  databaseUrl: "postgres://example",
}));

jest.mock("../src/store/supportRequestStoreDb", () => ({
  listAllForAdmin: jest.fn(),
  resolve: jest.fn(),
}));

const db = require("../src/db");
const supportRequestStore = require("../src/store/supportRequestStoreDb");
const adminRouter = require("../src/routes/admin");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.adminUserId = "admin-1";
    next();
  });
  app.use("/api/admin", adminRouter);
  return app;
}

describe("admin support report integration", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/admin/reports includes support requests", async () => {
    supportRequestStore.listAllForAdmin.mockResolvedValue([
      {
        id: "support-1",
        source: "support_request",
        status: "open",
        severity: "critical",
        reasonLabel: "Station Empty",
        details: "No umbrellas available",
        message: "Station Empty",
        createdAt: "2026-03-07T12:00:00.000Z",
      },
    ]);

    const res = await request(app).get("/api/admin/reports");

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(res.body.reports[0]).toMatchObject({
      id: "support-1",
      source: "support_request",
      severity: "critical",
      status: "open",
    });
  });

  test("GET /api/admin/stats counts only open critical support requests as critical alerts", async () => {
    db.query.mockImplementation(async (sql) => {
      if (sql.includes("FROM profiles")) {
        return { rows: [{ count: 3 }] };
      }
      if (sql.includes("FROM stations")) {
        return { rows: [{ total_capacity: 10, total_available: 7 }] };
      }
      return { rows: [] };
    });
    supportRequestStore.listAllForAdmin.mockResolvedValue([
      {
        id: "support-open-1",
        source: "support_request",
        status: "open",
        severity: "critical",
        createdAt: "2026-03-07T12:00:00.000Z",
      },
      {
        id: "support-open-2",
        source: "support_request",
        status: "open",
        severity: "non_critical",
        createdAt: "2026-03-07T11:00:00.000Z",
      },
      {
        id: "support-resolved-1",
        source: "support_request",
        status: "resolved",
        severity: "critical",
        createdAt: "2026-03-07T10:00:00.000Z",
      },
    ]);

    const res = await request(app).get("/api/admin/stats");

    expect(res.status).toBe(200);
    expect(res.body.openReportsCount).toBe(2);
    expect(res.body.openCriticalReportsCount).toBe(1);
    expect(res.body.reportsCount).toBe(3);
  });

  test("POST /api/admin/reports/:id/resolve resolves support requests from the DB store", async () => {
    supportRequestStore.resolve.mockResolvedValue({
      id: "support-1",
      source: "support_request",
      status: "resolved",
      resolvedAt: "2026-03-07T12:30:00.000Z",
    });

    const res = await request(app).post("/api/admin/reports/support-1/resolve").send({});

    expect(res.status).toBe(200);
    expect(supportRequestStore.resolve).toHaveBeenCalledWith("support-1", "admin-1");
    expect(res.body.report.status).toBe("resolved");
  });
});
