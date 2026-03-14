/**
 * Tests for src/middleware/requireAuth.js.  Because the module caches a
 * Supabase client based on environment variables we reset modules between
 * individual scenarios and control the mocked @supabase/supabase-js factory.
 */

const request = require("supertest");
const express = require("express");

let mockGetUser;

// utility for initializing module after adjusting env and mock
function loadModule() {
  jest.resetModules();
  // createClient returns object with auth.getUser stub
  jest.doMock("@supabase/supabase-js", () => ({
    createClient: jest.fn(() => ({ auth: { getUser: mockGetUser } })),
  }));
  return require("../../src/middleware/requireAuth");
}

describe("requireAuth middleware", () => {
  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    jest.clearAllMocks();
  });

  it("rejects when Authorization header missing", async () => {
    mockGetUser = jest.fn();
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    app.get("/x", (_req, res) => res.sendStatus(204));

    const res = await request(app).get("/x");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing or invalid Authorization header/);
  });

  it("returns 503 when supabase not configured", async () => {
    mockGetUser = jest.fn();
    // leave env blank
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    const res = await request(app)
      .get("/y")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/Auth not configured/);
  });

  it("401 when getUser returns no user", async () => {
    process.env.SUPABASE_URL = "https://supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    const res = await request(app)
      .get("/z")
      .set("Authorization", "Bearer tok");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid or expired token/);
  });

  it("401 with expired message when error contains expired", async () => {
    process.env.SUPABASE_URL = "u";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: "Token expired" } });
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    const res = await request(app)
      .get("/a")
      .set("Authorization", "Bearer t");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token expired\. Please log in again\./);
  });

  it("calls next and sets req.user when token valid", async () => {
    process.env.SUPABASE_URL = "url";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: "u1", email: "e@x" } }, error: null });
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    app.get("/ok", (req, res) => res.json({ user: req.user }));
    const res = await request(app)
      .get("/ok")
      .set("Authorization", "Bearer tok");
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: "u1", email: "e@x" });
  });

  it("treats missing email as null", async () => {
    process.env.SUPABASE_URL = "u";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: "u2", email: null } }, error: null });
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    app.get("/ok", (req, res) => res.json({ user: req.user }));
    const res = await request(app)
      .get("/ok")
      .set("Authorization", "Bearer tok");
    expect(res.body.user).toEqual({ id: "u2", email: null });
  });

  it("handles thrown errors with 500 and logs", async () => {
    process.env.SUPABASE_URL = "u";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
    const theErr = new Error("oops");
    mockGetUser = jest.fn().mockRejectedValue(theErr);
    const { requireAuth } = loadModule();

    const app = express();
    app.use(requireAuth);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(app)
      .get("/e")
      .set("Authorization", "Bearer tok");
    consoleSpy.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Authorization check failed/);
  });

  describe("getSupabase helper", () => {
    it("returns client when env vars set", () => {
      process.env.SUPABASE_URL = "u";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
      mockGetUser = jest.fn();
      const { getSupabase } = loadModule();
      const client = getSupabase();
      expect(client).toBeDefined();
      // second call returns same instance
      expect(getSupabase()).toBe(client);
    });

    it("returns null when vars missing", () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      mockGetUser = jest.fn();
      const { getSupabase } = loadModule();
      expect(getSupabase()).toBeNull();
    });
  });
});
