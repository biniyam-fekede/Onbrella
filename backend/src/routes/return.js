/**
 * POST /api/return — End a rental (return umbrella).
 * Body: { rentalId, stationId, umbrellaId [, sessionId ] }
 */

const express = require("express");
const rentalService = require("../services/rentalService");
const { requireJsonContentType, requireBody, requireFields, sessionId } = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  requireJsonContentType,
  requireBody,
  requireFields("rentalId", "stationId", "umbrellaId"),
  async (req, res, next) => {
    try {
      const sid = sessionId(req);
      const { rentalId, stationId, umbrellaId } = req.body;

      const stationIdStr = String(stationId).trim();
      const rentalIdStr = String(rentalId).trim();
      const umbrellaIdStr = String(umbrellaId).trim();

      const result = await rentalService.endRental(
        sid,
        rentalIdStr,
        stationIdStr,
        umbrellaIdStr
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;