/**
 * Backend entry point. Starts the Express server.
 */
require("dotenv").config();

const app = require("./app");
const config = require("./config");

function backendInitialized() {
  return "backend initialized";
}

function start() {
  const server = app.listen(config.port, () => {
    console.log(`On-Brella backend listening on port ${config.port}`);
  });
  return server;
}

// Start server when run directly (node server.js)
if (require.main === module) {
  start();
}

module.exports = { backendInitialized, start, app };
