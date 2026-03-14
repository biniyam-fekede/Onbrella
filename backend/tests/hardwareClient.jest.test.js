/**
 * Hardware client unit tests. Mocks global fetch.
 */

const originalFetch = global.fetch;

beforeEach(() => {
  jest.resetModules();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("hardwareClient", () => {
  test("getStations returns parsed JSON on 200", async () => {
    const mockStations = { stations: [{ stationId: "s1" }], totalStations: 1 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStations),
    });

    const { getStations } = require("../src/services/hardwareClient");
    const result = await getStations();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/hardware/stations"));
    expect(result).toEqual(mockStations);
  });

  test("getStations throws HardwareError on non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { getStations, HardwareError } = require("../src/services/hardwareClient");

    await expect(getStations()).rejects.toThrow(HardwareError);
    await expect(getStations()).rejects.toMatchObject({
      message: expect.stringContaining("500"),
      statusCode: 500,
    });
  });

  test("unlock sends POST with stationId", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, stationId: "s1" }),
    });

    const { unlock } = require("../src/services/hardwareClient");
    await unlock("station-001");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/hardware/unlock"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: "station-001" }),
      })
    );
  });

  test("unlock throws when success is false", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, message: "Unlock failed" }),
    });

    const { unlock, HardwareError } = require("../src/services/hardwareClient");

    await expect(unlock("station-001")).rejects.toThrow(HardwareError);
    await expect(unlock("station-001")).rejects.toMatchObject({
      message: "Unlock failed",
    });
  });

  test("returnUmbrella sends POST with stationId and umbrellaId", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { returnUmbrella } = require("../src/services/hardwareClient");
    await returnUmbrella("station-002", "umbrella-123");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/hardware/return"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: "station-002",
          umbrellaId: "umbrella-123",
        }),
      })
    );
  });
});