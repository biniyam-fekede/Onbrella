/**
 * requireAdmin — Verifies Supabase JWT, then allows access if user email is hardcoded admin
 * or profiles.role === 'admin'. Sets req.adminUserId, req.adminLocationId, req.isSuperAdmin.
 * Location-scoped admins only see/manage stations in their location; super admins see all.
 * Responds 401 when missing/invalid token, 403 when not admin.
 */
const { createClient } = require("@supabase/supabase-js");
const db = require("../db");

// Strip trailing slash so Supabase client works (dashboard copies URL with / sometimes)
const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = typeof rawUrl === "string" ? rawUrl.replace(/\/+$/, "") : "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Hardcoded admin email (backend). Override with env ADMIN_EMAIL. Treated as super admin. */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@onbrella.com").trim().toLowerCase();

function isAdminEmail(email) {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

let supabase = null;
function getSupabase() {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

async function requireAdmin(req, res, next) {
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
        "Admin auth not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env (use your Supabase project URL and Project Settings → API → service_role key). See docs/admin-setup.md.",
    });
  }

  try {
    const result = await client.auth.getUser(token);
    const user = result?.data?.user ?? null;
    const error = result?.error ?? null;

    if (error || !user?.id) {
      if (error?.message) {
        console.warn(
          "Admin token verification failed:",
          error.message,
          "— Ensure SUPABASE_SERVICE_ROLE_KEY is from the same project as SUPABASE_URL (check project ref in dashboard URL)."
        );
      }
      const message =
        error?.message?.toLowerCase().includes("expired")
          ? "Token expired. Please log in again."
          : "Invalid or expired token";
      return res.status(401).json({ error: message });
    }

    // Must be admin: hardcoded email or profiles.role = 'admin'
    const isHardcodedAdmin = isAdminEmail(user.email);
    if (!isHardcodedAdmin) {
      try {
        const { rows } = await db.query("SELECT role FROM profiles WHERE id = $1 LIMIT 1", [user.id]);
        if (rows[0]?.role !== "admin") {
          return res.status(403).json({ error: "Admin access required" });
        }
      } catch {
        return res.status(403).json({ error: "Admin access required" });
      }
    }

    req.adminUserId = user.id;
    req.adminLocationId = null;
    req.adminLocationIds = [];
    req.isSuperAdmin = true;

    // For all admins (including hardcoded email): check admin_location_assignments first.
    // If they have assignment(s), they are location-scoped; otherwise super admin.
    try {
      const { rows: assignmentRows } = await db.query(
        "SELECT location_id FROM admin_location_assignments WHERE profile_id = $1 ORDER BY created_at ASC",
        [user.id]
      );
      if (assignmentRows?.length > 0) {
        req.adminLocationIds = assignmentRows.map((r) => r.location_id).filter(Boolean);
        req.adminLocationId = req.adminLocationIds[0] ?? null;
        req.isSuperAdmin = false;
        return next();
      }
    } catch {
      /* admin_location_assignments may not exist; fall back to profiles */
    }

    // Fallback: profiles.location_id and profiles.is_super_admin (for non-hardcoded admins)
    if (!isHardcodedAdmin) {
      try {
        const { rows: profileRows } = await db.query(
          "SELECT location_id, COALESCE(is_super_admin, false) AS is_super_admin FROM profiles WHERE id = $1 LIMIT 1",
          [user.id]
        );
        const p = profileRows[0];
        if (p) {
          req.adminLocationId = p.location_id ?? null;
          req.adminLocationIds = req.adminLocationId ? [req.adminLocationId] : [];
          req.isSuperAdmin = p.is_super_admin === true || p.location_id == null;
        }
      } catch {
        /* location_id / is_super_admin columns may not exist yet; treat as super admin */
      }
    }
    return next();
  } catch (err) {
    if (err.statusCode === 403) throw err;
    console.error("requireAdmin error:", err);
    res.status(500).json({ error: "Authorization check failed" });
  }
}

/**
 * optionalAdmin — Same JWT + admin + location resolution as requireAdmin but never 401/403.
 * No token / invalid / not admin → next() with no location set (caller returns all stations).
 * Use on GET /api/stations so the map can send the session token and get location-filtered stations for admins.
 */
async function optionalAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!token) {
    return next();
  }

  const client = getSupabase();
  if (!client) {
    return next();
  }

  try {
    const result = await client.auth.getUser(token);
    const user = result?.data?.user ?? null;
    const error = result?.error ?? null;

    if (error || !user?.id) {
      return next();
    }

    const isHardcodedAdmin = isAdminEmail(user.email);
    if (!isHardcodedAdmin) {
      try {
        const { rows } = await db.query("SELECT role FROM profiles WHERE id = $1 LIMIT 1", [user.id]);
        if (rows[0]?.role !== "admin") {
          return next();
        }
      } catch {
        return next();
      }
    }

    req.adminUserId = user.id;
    req.adminLocationId = null;
    req.adminLocationIds = [];
    req.isSuperAdmin = true;

    try {
      const { rows: assignmentRows } = await db.query(
        "SELECT location_id FROM admin_location_assignments WHERE profile_id = $1 ORDER BY created_at ASC",
        [user.id]
      );
      if (assignmentRows?.length > 0) {
        req.adminLocationIds = assignmentRows.map((r) => r.location_id).filter(Boolean);
        req.adminLocationId = req.adminLocationIds[0] ?? null;
        req.isSuperAdmin = false;
        return next();
      }
    } catch {
      /* admin_location_assignments may not exist */
    }

    if (!isHardcodedAdmin) {
      try {
        const { rows: profileRows } = await db.query(
          "SELECT location_id, COALESCE(is_super_admin, false) AS is_super_admin FROM profiles WHERE id = $1 LIMIT 1",
          [user.id]
        );
        const p = profileRows[0];
        if (p) {
          req.adminLocationId = p.location_id ?? null;
          req.adminLocationIds = req.adminLocationId ? [req.adminLocationId] : [];
          req.isSuperAdmin = p.is_super_admin === true || p.location_id == null;
        }
      } catch {
        /* fallback columns may not exist */
      }
    }
    return next();
  } catch {
    return next();
  }
}

module.exports = { requireAdmin, optionalAdmin, getSupabase };
