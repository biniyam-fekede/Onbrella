/**
 * Payment Service
 *
 * Handles Stripe payment logic for umbrella rentals.
 *
 * Responsibilities:
 * - Calculate rental cost based on duration
 * - Create Stripe Checkout sessions
 * - Attach rental metadata for traceability
 */

const Stripe = require("stripe");
const config = require("../config");
const getRentalStore = require("../store/getRentalStore");
const configDb = require("../db/config");

// Lazily initialize Stripe client
let stripeClient = null;

/**
 * Returns a configured Stripe client instance.
 */
function getStripe() {
  if (!config.stripeSecretKey) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }

  return stripeClient;
}

/**
 * Calculate the rental price in cents.
 *
 * Pricing model:
 * unlockFee + (minutes * centsPerMinute)
 */
async function calculateRentalAmountCents(rental) {
  if (!rental?.startTime) {
    throw new Error("Rental missing start time");
  }

  const startMs = new Date(rental.startTime).getTime();
  const endMs = rental.endTime
    ? new Date(rental.endTime).getTime()
    : Date.now();

  const durationMs = Math.max(0, endMs - startMs);

  // Round up to the nearest minute
  const minutes = Math.max(1, Math.ceil(durationMs / 60000));

  const unlockFeeCents = parseInt(
    (await configDb.get("unlockFeeCents")) || "100",
    10
  );

  const centsPerMinute = parseInt(
    (await configDb.get("centsPerMinute")) || "10",
    10
  );

  return unlockFeeCents + minutes * centsPerMinute;
}

/**
 * Create a Stripe Checkout session for a completed rental.
 *
 * Returns the hosted Stripe checkout URL.
 */
async function createCheckoutSessionForRental(rentalId) {
  const rentalStore = getRentalStore();
  const rental = await rentalStore.getById(rentalId);

  if (!rental) {
    const err = new Error("Rental not found");
    err.statusCode = 404;
    throw err;
  }

  const amount = await calculateRentalAmountCents(rental);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "On-Brella Rental",
            description: `Umbrella rental from station ${rental.stationId || "unknown"}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    success_url: "http://localhost:5173/thank-you",
    cancel_url: "http://localhost:5173/history",

    metadata: {
      rentalId: rental.rentalId || rentalId,
      umbrellaId: rental.umbrellaId || "",
      stationId: rental.stationId || "",
    },
  });

  return {
    checkoutUrl: session.url,
  };
}

module.exports = {
  createCheckoutSessionForRental,
};