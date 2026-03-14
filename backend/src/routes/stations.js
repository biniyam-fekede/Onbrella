/**
 * GET /api/stations — List stations with availability.
 * If Authorization: Bearer <admin JWT> is sent and the user is a location-scoped admin,
 * returns only stations for that admin's location. Otherwise returns all stations.
 */

const express = require("express");
const { optionalAdmin } = require("../middleware/requireAdmin");
const rentalService = require("../services/rentalService");

const router = express.Router();

router.get("/", optionalAdmin, async (req, res, next) => {
  try {
    // Location-scoped admin: optionalAdmin sets adminLocationIds/adminLocationId; super admin or no auth → all stations
    const locationIds =
      !req.isSuperAdmin && req.adminLocationIds?.length > 0 ? req.adminLocationIds : null;
    const locationId =
      !req.isSuperAdmin && req.adminLocationId && !locationIds ? req.adminLocationId : null;
    const isFiltered = !!(locationIds?.length || locationId);
    res.setHeader("X-Stations-Filter", isFiltered ? "location-scoped" : "all");
    const data = await rentalService.getStations(
      locationIds ? { locationIds } : locationId ? { locationId } : {}
    );
    res.json(data);
  } catch (err) {
    res.setHeader("X-Stations-Filter", "all");
    // Avoid 500 when hardware mock is down or DB fails — return empty so map still loads
    res.json({ stations: [], totalStations: 0 });
  }
});

module.exports = router;
