/**
 * Tests for src/routes/return.js
 */

const request = require("supertest");
const express = require("express");

jest.mock("../../src/services/rentalService", () => ({
  endRental: jest.fn(),
}));

const rentalService = require("../../src/services/rentalService");
const router = require("../../src/routes/return");

describe("return router", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("success path", async () => {
    const fake = { success: true };
    rentalService.endRental.mockResolvedValue(fake);
    const res = await request(app)
      .post("/")
      .send({ rentalId: "r1", stationId: "s1", slotNumber: 2, umbrellaId: "u1" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fake);
  });

  test("errors are forwarded", async () => {
    const err = new Error("boom");
    rentalService.endRental.mockRejectedValue(err);
    const res = await request(app)
      .post("/")
      .send({ rentalId: "r1", stationId: "s1", slotNumber: 1, umbrellaId: "u1" });
    expect(res.status).toBe(500);
  });
});
