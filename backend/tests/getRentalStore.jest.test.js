/**
 * getRentalStore tests.
 */

const getRentalStore = require("../src/store/getRentalStore");

jest.mock("../src/config", () => ({
  databaseUrl: "mock-url",
}));

jest.mock("../src/store/rentalStoreDb", () => ({}));

describe("getRentalStore", () => {
  test("returns rentalStoreDb when databaseUrl is set", () => {
    const store = getRentalStore();
    expect(store).toBeDefined();
  });

  test("throws error when databaseUrl is not set", () => {
    const config = require("../src/config");
    config.databaseUrl = null;
    expect(() => getRentalStore()).toThrow("DATABASE_URL is required. Set it in backend/.env");
  });
});