/**
 * Tests for src/routes/support.js
 */

const request = require("supertest");
const express = require("express");

jest.mock("../../src/middleware/requireAuth", () => ({
  requireAuth: (req, res, next) => {
    // attach a dummy user
    req.user = { id: "u1", email: "a@b" };
    next();
  },
}));

jest.mock("../../src/store/supportRequestStoreDb", () => ({
  create: jest.fn(),
}));

const supportRequestStore = require("../../src/store/supportRequestStoreDb");
const router = require("../../src/routes/support");

describe("support router", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("successful request composes object and returns 201", async () => {
    supportRequestStore.create.mockResolvedValue({ id: 5 });
    const res = await request(app)
      .post("/requests")
      .send({ reason: "app_issue", details: "something" });
    expect(res.status).toBe(201);
    expect(res.body.supportRequest).toEqual({ id: 5 });
  });

  test("invalid reason returns 400", async () => {
    const res = await request(app)
      .post("/requests")
      .send({ reason: "not_allowed", details: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid support reason");
  });

  test("other with no details returns 400", async () => {
    const res = await request(app)
      .post("/requests")
      .send({ reason: "other", details: "" });
    expect(res.status).toBe(400);
  });

  test("details too long returns 400", async () => {
    const res = await request(app)
      .post("/requests")
      .send({ reason: "station_empty", details: "a".repeat(2001) });
    expect(res.status).toBe(400);
  });

  test("database not configured error returns 503", async () => {
    const err = new Error("Database not configured");
    supportRequestStore.create.mockRejectedValue(err);
    const res = await request(app)
      .post("/requests")
      .send({ reason: "app_issue", details: "ok" });
    expect(res.status).toBe(503);
  });

  test("table-not-exists error returns 503", async () => {
    const err = new Error("oops");
    err.code = "42P01";
    supportRequestStore.create.mockRejectedValue(err);
    const res = await request(app)
      .post("/requests")
      .send({ reason: "app_issue", details: "ok" });
    expect(res.status).toBe(503);
  });

  test("other errors propagate", async () => {
    supportRequestStore.create.mockRejectedValue(new Error("boom"));
    const res = await request(app)
      .post("/requests")
      .send({ reason: "app_issue", details: "ok" });
    expect(res.status).toBe(500);
  });
});
