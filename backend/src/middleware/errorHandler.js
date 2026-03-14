/**
 * Central error handler. Maps business errors to HTTP status codes.
 */

const { RentalError } = require("../services/rentalService");
const { HardwareError } = require("../services/hardwareClient");

function errorHandler(err, _req, res, _next) {
  if (err instanceof RentalError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }
  if (err instanceof HardwareError) {
    return res.status(err.statusCode >= 400 ? err.statusCode : 502).json({
      success: false,
      error: err.message,
    });
  }
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON body",
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}

module.exports = errorHandler;
