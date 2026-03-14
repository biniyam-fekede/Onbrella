/**
 * requireAuth middleware tests.
 */

const { createClient } = require("@supabase/supabase-js");

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
};

createClient.mockReturnValue(mockSupabaseClient);

// Mock the requireAuth module
jest.mock("../src/middleware/requireAuth", () => ({
  requireAuth: jest.fn(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const client = mockSupabaseClient;
    if (!client) {
      return res.status(503).json({
        error:
          "Auth not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
      });
    }

    try {
      const result = await client.auth.getUser(token);
      const user = result?.data?.user ?? null;
      const error = result?.error ?? null;

      if (error || !user?.id) {
        const message =
          error?.message?.toLowerCase().includes("expired")
            ? "Token expired. Please log in again."
            : "Invalid or expired token";
        return res.status(401).json({ error: message });
      }

      req.user = { id: user.id, email: user.email || null };
      next();
    } catch (err) {
      return res.status(500).json({ error: "Authorization check failed" });
    }
  }),
  getSupabase: jest.fn(() => mockSupabaseClient),
}));

const requireAuthModule = require("../src/middleware/requireAuth");

describe("requireAuth", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("returns 401 when no authorization header", async () => {
    await requireAuthModule.requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing or invalid Authorization header" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when authorization header without Bearer", async () => {
    req.headers.authorization = "Basic token";
    await requireAuthModule.requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing or invalid Authorization header" });
  });

  test("returns 401 when getUser fails", async () => {
    req.headers.authorization = "Bearer invalid-token";
    mockSupabaseClient.auth.getUser.mockResolvedValue({ error: { message: "Invalid token" }, data: { user: null } });
    await requireAuthModule.requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });

  test("returns 401 when token expired", async () => {
    req.headers.authorization = "Bearer expired-token";
    mockSupabaseClient.auth.getUser.mockResolvedValue({ error: { message: "JWT expired" }, data: { user: null } });
    await requireAuthModule.requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token expired. Please log in again." });
  });

  test("sets req.user and calls next on valid token", async () => {
    req.headers.authorization = "Bearer valid-token";
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "user@example.com" }
      }
    });
    await requireAuthModule.requireAuth(req, res, next);
    expect(req.user).toEqual({ id: "user-123", email: "user@example.com" });
    expect(next).toHaveBeenCalled();
  });

  test("handles user without email", async () => {
    req.headers.authorization = "Bearer valid-token";
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    await requireAuthModule.requireAuth(req, res, next);
    expect(req.user).toEqual({ id: "user-123", email: null });
    expect(next).toHaveBeenCalled();
  });

  test("returns 500 on unexpected error", async () => {
    req.headers.authorization = "Bearer token";
    mockSupabaseClient.auth.getUser.mockRejectedValue(new Error("Network error"));
    await requireAuthModule.requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Authorization check failed" });
  });
});