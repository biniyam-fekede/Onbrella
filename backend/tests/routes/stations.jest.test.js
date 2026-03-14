/**
 * Tests for src/routes/stations.js
 */

const request = require("supertest");
const express = require("express");

jest.mock("../../src/services/rentalService", () => ({
  getStations: jest.fn(),
}));

const rentalService = require("../../src/services/rentalService");
const router = require("../../src/routes/stations");

describe("stations router", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(router);
  });

  test("returns data from service", async () => {
    const data = { stations: [{ id: 1 }], totalStations: 1 };
    rentalService.getStations.mockResolvedValue(data);
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(data);
  });

  test("errors yield empty response", async () => {
    rentalService.getStations.mockRejectedValue(new Error("boom"));
    const res = await request(app).get("/");
    expect(res.body).toEqual({ stations: [], totalStations: 0 });
  });
});
