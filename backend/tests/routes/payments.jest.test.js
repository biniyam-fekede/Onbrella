/**
 * Tests for src/routes/payments.js
 */

const request = require("supertest");
const express = require("express");

jest.mock("../../src/services/paymentService", () => ({
  createCheckoutSessionForRental: jest.fn(),
}));

const paymentService = require("../../src/services/paymentService");
const router = require("../../src/routes/payments");

describe("payments router", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("creates session when body valid", async () => {
    const session = { checkoutUrl: "https://fake" };
    paymentService.createCheckoutSessionForRental.mockResolvedValue(session);
    const res = await request(app)
      .post("/create-checkout-session")
      .send({ rentalId: "r1" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(session);
  });

  test("passes errors to express", async () => {
    const err = new Error("stripe");
    paymentService.createCheckoutSessionForRental.mockRejectedValue(err);
    const res = await request(app)
      .post("/create-checkout-session")
      .send({ rentalId: "r1" });
    expect(res.status).toBe(500);
  });
});
