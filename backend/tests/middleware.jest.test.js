/**
 * Middleware unit tests. Tests validate and errorHandler via a minimal Express app.
 */

const request = require("supertest");
const express = require("express");
const { requireBody, requireFields, sessionId } = require("../src/middleware/validate");
const errorHandler = require("../src/middleware/errorHandler");
const { RentalError } = require("../src/services/rentalService");
const { HardwareError } = require("../src/services/hardwareClient");

function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe("validate.requireBody", () => {
  test("returns 400 when body is missing", async () => {
    const app = express();
    app.post("/test", requireBody, (req, res) => res.json({ ok: true }));
    const res = await request(app).post("/test");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("body");
  });

  test("calls next when body exists", async () => {
    const app = createTestApp();
    app.post("/test", requireBody, (req, res) => res.json({ ok: true }));

    const res = await request(app).post("/test").send({ foo: 1 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("validate.requireFields", () => {
  test("returns 400 when field is missing", async () => {
    const app = createTestApp();
    app.post("/test", requireBody, requireFields("stationId", "slotNumber"), (req, res) =>
      res.json({ ok: true })
    );

    const res = await request(app)
      .post("/test")
      .send({ stationId: "s1" }); // missing slotNumber
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("slotNumber");
  });

  test("returns 400 when field is empty string", async () => {
    const app = createTestApp();
    app.post("/test", requireBody, requireFields("stationId"), (req, res) =>
      res.json({ ok: true })
    );

    const res = await request(app).post("/test").send({ stationId: "" });
    expect(res.status).toBe(400);
  });

  test("calls next when all fields present", async () => {
    const app = createTestApp();
    app.post("/test", requireBody, requireFields("a", "b"), (req, res) =>
      res.json({ ok: true })
    );

    const res = await request(app).post("/test").send({ a: 1, b: 2 });
    expect(res.status).toBe(200);
  });
});

describe("validate.sessionId", () => {
  test("returns X-Session-Id header when set", () => {
    const req = { headers: { "x-session-id": "header-session" }, body: {} };
    expect(sessionId(req)).toBe("header-session");
  });

  test("returns body.sessionId when header not set", () => {
    const req = { headers: {}, body: { sessionId: "body-session" } };
    expect(sessionId(req)).toBe("body-session");
  });

  test("returns guest when neither set", () => {
    const req = { headers: {}, body: {} };
    expect(sessionId(req)).toBe("guest");
  });
});

describe("errorHandler", () => {
  test("RentalError maps to statusCode", async () => {
    const app = createTestApp();
    app.get("/err", () => {
      throw new RentalError("Conflict", 409);
    });
    app.use(errorHandler);

    const res = await request(app).get("/err");
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  test("HardwareError maps to statusCode", async () => {
    const app = createTestApp();
    app.get("/err", () => {
      throw new HardwareError("Bad gateway", 502);
    });
    app.use(errorHandler);

    const res = await request(app).get("/err");
    expect(res.status).toBe(502);
  });

  test("generic error returns 500", async () => {
    const app = createTestApp();
    app.get("/err", () => {
      throw new Error("Unexpected");
    });
    app.use(errorHandler);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(app).get("/err");
    consoleSpy.mockRestore();

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
