/**
 * Database layer. Connects to Supabase (Postgres) via DATABASE_URL.
 * Used only by the business layer; never by the frontend.
 */

const { Pool } = require("pg");
const config = require("../config");

let pool = null;

function getPool() {
  if (!config.databaseUrl) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

/**
 * Run a query. Returns rows or throws.
 * @param {string} text
 * @param {Array} [params]
 * @returns {Promise<{ rows: Array, rowCount: number }>}
 */
async function query(text, params) {
  const p = getPool();
  if (!p) {
    throw new Error("Database not configured: set DATABASE_URL or SUPABASE_DATABASE_URL");
  }
  return p.query(text, params);
}

/**
 * Check database connectivity. Resolves to true if OK, false if no URL or connection failed.
 */
async function healthCheck() {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  healthCheck,
  close,
};
