/**
 * Tests for src/routes/rent.js
 */

const request = require("supertest");
const express = require("express");

jest.mock("../../src/services/rentalService", () => ({
  startRental: jest.fn(),
}));

const rentalService = require("../../src/services/rentalService");
const router = require("../../src/routes/rent");

describe("rent router", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("success path", async () => {
    const fake = { success: true };
    rentalService.startRental.mockResolvedValue(fake);
    const res = await request(app)
      .post("/")
      .send({ stationId: "s1", slotNumber: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(fake);
  });

  test("errors are forwarded", async () => {
    const err = new Error("boom");
    rentalService.startRental.mockRejectedValue(err);
    const res = await request(app)
      .post("/")
      .send({ stationId: "s1", slotNumber: 1 });
    expect(res.status).toBe(500);
  });
});
