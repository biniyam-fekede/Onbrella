/**
 * Request validation helpers. Returns 400 for bad input.
 */

/** Require JSON bodies for write requests. Use before requireBody. */
function requireJsonContentType(req, res, next) {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) return next();
  const ct = (req.headers["content-type"] || "").trim().toLowerCase();
  if (!ct || !ct.includes("application/json")) {
    return res.status(400).json({
      success: false,
      error:
        "Content-Type must be application/json. In Hoppscotch: Headers tab → add Content-Type: application/json",
    });
  }
  next();
}

function requireBody(req, res, next) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      error: "Request body is required. Use Content-Type: application/json",
    });
  }
  next();
}

function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] == null || req.body[f] === "",
    );
    if (missing.length > 0) {
      const hint =
        Object.keys(req.body).length === 0
          ? " (body was empty or not JSON—check Content-Type: application/json)"
          : "";
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}${hint}`,
      });
    }
    next();
  };
}

/** Session ID from header or body. Defaults to a guest id for MVP. */
function sessionId(req) {
  return req.headers["x-session-id"] || req.body.sessionId || "guest";
}

module.exports = {
  requireJsonContentType,
  requireBody,
  requireFields,
  sessionId,
};
