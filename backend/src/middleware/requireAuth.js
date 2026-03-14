/**
 * requireAuth — Verifies a Supabase JWT for authenticated user routes.
 * Expects Authorization: Bearer <access_token>. Sets req.user.
 */
const { createClient } = require("@supabase/supabase-js");

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = typeof rawUrl === "string" ? rawUrl.replace(/\/+$/, "") : "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const client = getSupabase();
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

    req.user = {
      id: user.id,
      email: user.email || null,
    };
    return next();
  } catch (err) {
    console.error("requireAuth error:", err);
    return res.status(500).json({ error: "Authorization check failed" });
  }
}

module.exports = { requireAuth, getSupabase };
