/**
 * Authenticated user support routes.
 */
const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  requireJsonContentType,
  requireBody,
  requireFields,
  sessionId,
} = require("../middleware/validate");
const supportRequestStore = require("../store/supportRequestStoreDb");

const router = express.Router();

const ALLOWED_REASONS = new Set([
  "station_empty",
  "station_full",
  "damaged_umbrella",
  "app_issue",
  "other",
]);

function normalizeDetails(value) {
  if (value == null) return "";
  return String(value).trim();
}

router.post(
  "/requests",
  requireAuth,
  requireJsonContentType,
  requireBody,
  requireFields("reason"),
  async (req, res, next) => {
    try {
      const reason = String(req.body.reason || "").trim();
      const details = normalizeDetails(req.body.details);

      if (!ALLOWED_REASONS.has(reason)) {
        return res.status(400).json({ error: "Invalid support reason" });
      }

      if (reason === "other" && !details) {
        return res.status(400).json({
          error: "Please provide more details when selecting Other.",
        });
      }

      if (details.length > 2000) {
        return res.status(400).json({
          error: "Details must be 2000 characters or less.",
        });
      }

      const supportRequest = await supportRequestStore.create({
        userId: req.user.id,
        userEmail: req.user.email,
        sessionId: sessionId(req),
        reason,
        details,
      });

      return res.status(201).json({ supportRequest });
    } catch (err) {
      if (err.code === "42P01") {
        return res.status(503).json({
          error:
            "Support requests table is not set up yet. Run docs/supabase-create-support-requests-table.sql.",
        });
      }
      if (err.message?.includes("Database not configured")) {
        return res.status(503).json({ error: err.message });
      }
      return next(err);
    }
  }
);

module.exports = router;
