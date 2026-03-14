/**
 * Config database operations. Stores key-value configuration settings.
 */

const db = require("./index");

/**
 * Get a config value by key.
 * @param {string} key
 * @returns {Promise<string|null>} The value or null if not found
 */
async function get(key) {
  const { rows } = await db.query("SELECT value FROM config WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

/**
 * Set a config value by key.
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
async function set(key, value) {
  await db.query(
    "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
    [key, value]
  );
}

/**
 * Get all config entries.
 * @returns {Promise<Array<{key: string, value: string}>>}
 */
async function getAll() {
  const { rows } = await db.query("SELECT key, value FROM config ORDER BY key");
  return rows;
}

module.exports = {
  get,
  set,
  getAll,
};