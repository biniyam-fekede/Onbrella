/**
 * GET /api/history — List completed rental history for the current session.
 *
 * Session is taken from X-Session-Id header (same as /api/rent and /api/return).
 * Only rentals with status 'COMPLETED' are returned, ordered by start_time DESC.
 *
 * Query params:
 *   - limit (optional): max number of rentals to return (default 20, max 100)
 *   - offset (optional): pagination offset (default 0)
 *
 * Response: { rentals: Array, total: number, limit: number, offset: number }
 */

const express = require("express");
const { sessionId } = require("../middleware/validate");
const getRentalStore = require("../store/getRentalStore");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const sid = sessionId(req);
    const rawLimit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const rawOffset = req.query.offset != null ? Number(req.query.offset) : undefined;

    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const store = getRentalStore();
    const [rentals, total] = await Promise.all([
      store.listBySession(sid, { limit, offset }),
      store.countBySession(sid),
    ]);

    res.json({
      rentals,
      total,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

