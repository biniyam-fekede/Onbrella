/**
 * requireAdmin middleware tests.
 */

const { createClient } = require("@supabase/supabase-js");

// Mock external dependencies
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
};

createClient.mockReturnValue(mockSupabaseClient);

const mockDb = require("../src/db");

// Import the actual middleware after mocking
const { requireAdmin, getSupabase } = require("../src/middleware/requireAdmin");

describe("requireAdmin middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables before importing
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.ADMIN_EMAIL = "admin@onbrella.com";

    // Reset the supabase instance to force recreation with mocks
    // We need to clear the cached module and re-mock
    jest.resetModules();
    
    // Re-apply mocks after reset
    jest.mock("@supabase/supabase-js", () => ({
      createClient: jest.fn().mockReturnValue(mockSupabaseClient),
    }));
    
    jest.mock("../src/db", () => ({
      query: jest.fn(),
    }));
    
    // Re-require with fresh mocks
    const module = require("../src/middleware/requireAdmin");
    
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ADMIN_EMAIL;
  });

  describe("requireAdmin", () => {
    test("should return 401 when no authorization header", async () => {
      const { requireAdmin } = require("../src/middleware/requireAdmin");
      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing or invalid Authorization header" });
      expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 when authorization header doesn't start with Bearer", async () => {
      const { requireAdmin } = require("../src/middleware/requireAdmin");
      req.headers.authorization = "Basic token123";
      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing or invalid Authorization header" });
      expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 when token is invalid", async () => {
      const { requireAdmin } = require("../src/middleware/requireAdmin");
      req.headers.authorization = "Bearer invalid-token";
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" }
      });

      await requireAdmin(req, res, next);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith("invalid-token");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
      expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 when token is expired", async () => {
      const { requireAdmin } = require("../src/middleware/requireAdmin");
      req.headers.authorization = "Bearer expired-token";
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "JWT expired" }
      });

      await requireAdmin(req, res, next);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith("expired-token");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Token expired. Please log in again." });
      expect(next).not.toHaveBeenCalled();
    });

    test("should allow access for hardcoded admin email", async () => {
      const { requireAdmin } = require("../src/middleware/requireAdmin");
      req.headers.authorization = "Bearer admin-token";
      const mockUser = {
        id: "admin-123",
        email: "admin@onbrella.com"
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await requireAdmin(req, res, next);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith("admin-token");
      expect(req.adminUserId).toBe("admin-123");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should return 500 when getUser throws an error", async () => {
      const { requireAdmin } = require("../src/middleware/requireAdmin");
      req.headers.authorization = "Bearer token123";
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error("Network error"));

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Authorization check failed" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("getSupabase", () => {
    test("should return null when SUPABASE_URL is not set", () => {
      delete process.env.SUPABASE_URL;
      const client = getSupabase();
      expect(client).toBeNull();
    });

    test("should return null when SUPABASE_SERVICE_ROLE_KEY is not set", () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const client = getSupabase();
      expect(client).toBeNull();
    });
  });
});
