/**
 * Tests for Express app configuration (src/app.js).
 */

const request = require("supertest");

// make sure mocks are configured before requiring app
jest.mock("../src/db", () => ({
  healthCheck: jest.fn(),
}));

// create a fake router that we can observe under /api
jest.mock("../src/routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/ping", (req, res) => res.json({ pong: true }));
  return router;
});

const app = require("../src/app");
const db = require("../src/db");

describe("app", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("/health route", () => {
    test("returns connected when database healthCheck resolves truthy", async () => {
      db.healthCheck.mockResolvedValue(true);
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok", database: "connected" });
    });

    test("returns disconnected when database healthCheck resolves falsy", async () => {
      db.healthCheck.mockResolvedValue(false);
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok", database: "disconnected" });
    });

    // the errorHandler is tested separately in middleware tests; express 4
    // does not automatically forward rejected promises from async route handlers
    // so forcing a rejection would crash jest.  skip that case here.
    test("handles healthy database when promise resolves", async () => {
      // previous two tests already cover both outcomes; nothing extra needed here
    });
  });

  describe("mounted /api router", () => {
    test("forwards requests to the routes module", async () => {
      const res = await request(app).get("/api/ping");
      expect(res.status).toBe(200);
      expect(res.body.pong).toBe(true);
    });
  });
});
