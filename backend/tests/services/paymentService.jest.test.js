/**
 * Unit tests for src/services/paymentService.js
 *
 * The service exposes only createCheckoutSessionForRental, but that helper
 * calls calculateRentalAmountCents and getStripe internally; exercising all
 * code paths through the public API gives us full coverage.
 */

const configPath = "../../src/config";
const configDbPath = "../../src/db/config";
// jest.mock calls are hoisted; avoid referencing variables
jest.mock("../../src/store/getRentalStore", () => jest.fn());
jest.mock("../../src/db/config", () => ({ get: jest.fn() }));

let StripeMock;
let config;
let configDb;
let getRentalStore;
let paymentService;

/**
 * Reload the service module while resetting mocks.  An optional
 * factory can be provided to customize how the stripe constructor
 * is mocked (so we can make it reject for specific tests).
 */
function reloadService(stripeFactory) {
  jest.resetModules();
  // re-require mocks and config
  config = require(configPath);
  configDb = require(configDbPath);
  getRentalStore = require("../../src/store/getRentalStore");
  // stripe mock factory: allow custom behaviour for a single test
  if (stripeFactory) {
    jest.doMock("stripe", stripeFactory);
  } else {
    jest.doMock("stripe", () => {
      StripeMock = jest.fn().mockImplementation(() => ({
        checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: "https://fake" }) } },
      }));
      return StripeMock;
    });
  }
  paymentService = require("../../src/services/paymentService");
}

describe("paymentService", () => {
  beforeEach(() => {
    reloadService();
    // reset env/config
    delete config.stripeSecretKey;
    configDb.get.mockReset();
    getRentalStore.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("throws when Stripe not configured", async () => {
    config.stripeSecretKey = undefined;
    const store = { getById: jest.fn().mockResolvedValue({ startTime: new Date().toISOString() }) };
    getRentalStore.mockReturnValue(store);
    await expect(paymentService.createCheckoutSessionForRental("r1")).rejects.toThrow(
      /Stripe is not configured/
    );
  });

  test("404 error when rental missing", async () => {
    config.stripeSecretKey = "sk_test";
    getRentalStore.mockReturnValue({ getById: jest.fn().mockResolvedValue(null) });
    await expect(paymentService.createCheckoutSessionForRental("foo")).rejects.toMatchObject({
      statusCode: 404,
      message: /Rental not found/, // message defaults to error.message
    });
  });

  test("propagates amount-calculation error (missing start time)", async () => {
    config.stripeSecretKey = "sk";
    getRentalStore.mockReturnValue({ getById: jest.fn().mockResolvedValue({ rentalId: "r" }) });
    await expect(paymentService.createCheckoutSessionForRental("r")).rejects.toThrow(/Rental missing start time/);
  });

  test("creates session with correct pricing and metadata", async () => {
    config.stripeSecretKey = "sk";
    // set configDb to custom fees
    configDb.get.mockImplementation(async (k) => {
      if (k === "unlockFeeCents") return "200";
      if (k === "centsPerMinute") return "20";
      return null;
    });
    // fixed time values
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2025-01-01T00:10:30Z"); // 11 minutes => minutes=11
    jest.spyOn(Date, "now").mockReturnValue(end.getTime());

    const rental = {
      rentalId: "r123",
      stationId: "S1",
      umbrellaId: "U1",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
    getRentalStore.mockReturnValue({ getById: jest.fn().mockResolvedValue(rental) });

    const result = await paymentService.createCheckoutSessionForRental("r123");
    expect(result.checkoutUrl).toBe("https://fake");

    // verify stripe create was called with computed amount: 200 + 11*20 = 420
    expect(StripeMock).toHaveBeenCalledWith("sk");
    const stripeInstance = StripeMock.mock.results[0].value;
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 420,
            }),
          }),
        ],
        metadata: expect.objectContaining({ rentalId: "r123", umbrellaId: "U1", stationId: "S1" }),
      })
    );
  });

  test("defaults unlock fee and per-minute when configDb returns nothing", async () => {
    config.stripeSecretKey = "sk";
    configDb.get.mockResolvedValue(null);
    const start = new Date("2025-01-01T00:00:00Z");
    jest.spyOn(Date, "now").mockReturnValue(start.getTime() + 60000);
    const rental = { rentalId: "id", startTime: start.toISOString(), stationId: null, umbrellaId: null };
    getRentalStore.mockReturnValue({ getById: jest.fn().mockResolvedValue(rental) });
    const res = await paymentService.createCheckoutSessionForRental("id");
    expect(res.checkoutUrl).toBe("https://fake");
    const stripeInstance = StripeMock.mock.results[0].value;
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalled();
    const call = stripeInstance.checkout.sessions.create.mock.calls[0][0];
    expect(call.line_items[0].price_data.unit_amount).toBe(100 + 1 * 10);
  });

  test("caches stripe client between calls", async () => {
    config.stripeSecretKey = "sk";
    const rental = { rentalId: "a", startTime: new Date().toISOString() };
    getRentalStore.mockReturnValue({ getById: jest.fn().mockResolvedValue(rental) });
    // make calculateRentalAmountCents succeed by providing date
    configDb.get.mockResolvedValue("0");
    await paymentService.createCheckoutSessionForRental("a");
    await paymentService.createCheckoutSessionForRental("a");
    expect(StripeMock).toHaveBeenCalledTimes(1);
  });

  test("error thrown inside stripe create propagates", async () => {
    const bad = new Error("stripe fail");
    // reload service with a stripe mock that rejects when creating a session
    reloadService(() => {
      StripeMock = jest.fn().mockImplementation(() => ({
        checkout: { sessions: { create: jest.fn().mockRejectedValue(bad) } },
      }));
      return StripeMock;
    });
    // ensure stripe config is present after reload
    config.stripeSecretKey = "sk";

    const rental = { rentalId: "x", startTime: new Date().toISOString() };
    getRentalStore.mockReturnValue({ getById: jest.fn().mockResolvedValue(rental) });
    configDb.get.mockResolvedValue("0");
    await expect(paymentService.createCheckoutSessionForRental("x")).rejects.toBe(bad);
  });
});
