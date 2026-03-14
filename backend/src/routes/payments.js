/**
 * Payments API Routes
 *
 * These endpoints allow the frontend to create Stripe Checkout sessions
 * for completed umbrella rentals.
 */

const express = require("express");
const {
  requireJsonContentType,
  requireBody,
  requireFields,
} = require("../middleware/validate");

const {
  createCheckoutSessionForRental,
} = require("../services/paymentService");

const router = express.Router();

/**
 * POST /api/payments/create-checkout-session
 *
 * Request body:
 * {
 *   rentalId: string
 * }
 *
 * Response:
 * {
 *   checkoutUrl: string
 * }
 */
router.post(
  "/create-checkout-session",
  requireJsonContentType,
  requireBody,
  requireFields("rentalId"),
  async (req, res, next) => {
    try {
      const rentalId = String(req.body.rentalId).trim();

      const session = await createCheckoutSessionForRental(rentalId);

      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;