/**
 * Rental service unit tests. Mocks hardwareClient and getRentalStore (no DB).
 */

const mockUnlock = jest.fn();
const mockReturnUmbrella = jest.fn();
const mockGetStations = jest.fn();
const mockGetByStationId = jest.fn();
const mockDecrementNumBrellas = jest.fn();
const mockIncrementNumBrellas = jest.fn();
const mockListStations = jest.fn();
const mockUpsertStation = jest.fn();

const { createMockRentalStore } = require("./mockRentalStore");
const mockStore = createMockRentalStore();

jest.mock("../src/store/getRentalStore", () => () => mockStore);

jest.mock("../src/db", () => ({
  getPool: jest.fn(() => ({})),
}));

// mock pricing config access
jest.mock("../src/db/config", () => ({
  get: jest.fn().mockResolvedValue("100"),
  set: jest.fn(),
}));

jest.mock("../src/db/stations", () => ({
  getByStationId: (...args) => mockGetByStationId(...args),
  decrementNumBrellas: (...args) => mockDecrementNumBrellas(...args),
  incrementNumBrellas: (...args) => mockIncrementNumBrellas(...args),
  listStations: (...args) => mockListStations(...args),
  upsertStation: (...args) => mockUpsertStation(...args),
}));

jest.mock("../src/services/hardwareClient", () => ({
  getStations: (...args) => mockGetStations(...args),
  unlock: (...args) => mockUnlock(...args),
  returnUmbrella: (...args) => mockReturnUmbrella(...args),
  HardwareError: class HardwareError extends Error {
    constructor(msg, code = 502) {
      super(msg);
      this.statusCode = code;
    }
  },
}));

jest.resetModules();
const rentalService = require("../src/services/rentalService");
const { RentalError } = rentalService;

beforeEach(() => {
  mockStore.clear();

  mockGetStations.mockReset();
  mockUnlock.mockReset();
  mockReturnUmbrella.mockReset();
  mockGetByStationId.mockReset();
  mockDecrementNumBrellas.mockReset();
  mockIncrementNumBrellas.mockReset();
  mockListStations.mockReset();
  mockUpsertStation.mockReset();

  mockGetStations.mockResolvedValue({
    stations: [{ stationId: "station-001" }],
    totalStations: 1,
  });

  mockUnlock.mockResolvedValue({ success: true });
  mockReturnUmbrella.mockResolvedValue({ success: true });

  mockGetByStationId.mockImplementation(async (stationId) => ({
    station_id: stationId,
    capacity: 10,
    num_brellas: 5,
    name: `Station ${stationId}`,
    status: "operational",
  }));

  mockDecrementNumBrellas.mockResolvedValue();
  mockIncrementNumBrellas.mockResolvedValue();
  mockListStations.mockResolvedValue([]);
  mockUpsertStation.mockResolvedValue();
});

describe("rentalService.getStations", () => {
  test("returns stations from hardware client", async () => {
    const result = await rentalService.getStations();
    expect(mockGetStations).toHaveBeenCalled();
    expect(result.stations).toHaveLength(1);
    expect(result.stations[0].stationId).toBe("station-001");
  });

  test("returns stations from DB when available", async () => {
    mockListStations.mockResolvedValue([
      {
        station_id: "db-station",
        capacity: 10,
        num_brellas: 5,
        latitude: 45,
        longitude: -122,
        name: "DB Station",
        status: "operational",
      },
    ]);

    const result = await rentalService.getStations();
    expect(mockListStations).toHaveBeenCalled();
    expect(result.stations).toHaveLength(1);
    expect(result.stations[0].stationId).toBe("db-station");
    expect(result.stations[0].capacity).toBe(10);
  });

  test("falls back to hardware when DB has no stations", async () => {
    mockListStations.mockResolvedValue([]);

    const result = await rentalService.getStations();
    expect(mockListStations).toHaveBeenCalled();
    expect(mockGetStations).toHaveBeenCalled();
    expect(result.stations).toHaveLength(1);
  });

  test("returns empty when hardware fails", async () => {
    mockGetStations.mockRejectedValue(new Error("Hardware error"));
    const result = await rentalService.getStations();
    expect(result.stations).toHaveLength(0);
    expect(result.totalStations).toBe(0);
  });
});

describe("rentalService.startRental", () => {
  test("calls unlock with stationId", async () => {
    await rentalService.startRental("s1", "station-001");
    expect(mockUnlock).toHaveBeenCalledWith("station-001");
  });

  test("returns success with rentalId, umbrellaId, startTime", async () => {
    const result = await rentalService.startRental("s1", "station-001");
    expect(result.success).toBe(true);
    expect(result.rentalId).toMatch(/^rental-/);
  expect(result.umbrellaId).toBe("umbrella-station-001-undefined");
    expect(result.startTime).toBeDefined();
  });

  test("throws 409 when session already has active rental", async () => {
    await rentalService.startRental("s1", "station-001");
    await expect(rentalService.startRental("s1", "station-001")).rejects.toThrow(RentalError);
    await expect(rentalService.startRental("s1", "station-001")).rejects.toMatchObject({
      statusCode: 409,
      message: "Session already has an active rental",
    });
  });

  test("different sessions can have simultaneous rentals", async () => {
    const r1 = await rentalService.startRental("s1", "station-001");
    const r2 = await rentalService.startRental("s2", "station-001");
    expect(r1.rentalId).not.toBe(r2.rentalId);
  });

  test("throws 503 when hardware unlock fails with fetch error", async () => {
    mockUnlock.mockRejectedValue(new Error("fetch failed"));
    await expect(rentalService.startRental("s1", "station-001")).rejects.toMatchObject({
      statusCode: 503,
      message: "Hardware unavailable",
    });
  });

  test("rethrows hardware error with statusCode", async () => {
    const err = new Error("Unlock failed");
    err.statusCode = 409;
    mockUnlock.mockRejectedValue(err);
    await expect(rentalService.startRental("s1", "station-001")).rejects.toMatchObject({
      statusCode: 409,
      message: "Unlock failed",
    });
  });
});

describe("rentalService.endRental", () => {
  test("calls returnUmbrella and completes rental", async () => {
    const start = await rentalService.startRental("s1", "station-001");
    const result = await rentalService.endRental(
      "s1",
      start.rentalId,
      "station-002",
      start.umbrellaId
    );

    expect(mockGetByStationId).toHaveBeenCalledWith("station-002");
    expect(mockReturnUmbrella).toHaveBeenCalledWith("station-002", start.umbrellaId);
    expect(result.success).toBe(true);
    expect(result.endTime).toBeDefined();
    expect(result.costCents).toBeGreaterThanOrEqual(100);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  test("throws 404 when rental not found", async () => {
    mockReturnUmbrella.mockClear();

    await expect(
      rentalService.endRental("s1", "rental-fake", "station-001", "umbrella-1")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Rental not found",
    });

    expect(mockReturnUmbrella).not.toHaveBeenCalled();
  });

  test("throws 409 when rental already completed", async () => {
    const start = await rentalService.startRental("s1", "station-001");
    await rentalService.endRental("s1", start.rentalId, "station-002", start.umbrellaId);

    await expect(
      rentalService.endRental("s1", start.rentalId, "station-002", start.umbrellaId)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Rental is not active",
    });
  });

  test("throws 403 when session does not own rental", async () => {
    const start = await rentalService.startRental("session-owner", "station-001");
    mockReturnUmbrella.mockClear();

    await expect(
      rentalService.endRental("other-session", start.rentalId, "station-002", start.umbrellaId)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Rental does not belong to this session",
    });

    expect(mockReturnUmbrella).not.toHaveBeenCalled();
  });

  test("throws 503 when hardware return fails with fetch error", async () => {
    const start = await rentalService.startRental("s1", "station-001");
    mockReturnUmbrella.mockRejectedValue(new Error("fetch failed"));

    await expect(
      rentalService.endRental("s1", start.rentalId, "station-002", start.umbrellaId)
    ).rejects.toMatchObject({
      statusCode: 503,
      message: "Hardware unavailable",
    });
  });

  test("throws 404 when return station not found", async () => {
    const start = await rentalService.startRental("s1", "station-001");
    mockGetByStationId.mockResolvedValueOnce(null);

    await expect(
      rentalService.endRental("s1", start.rentalId, "station-unknown", start.umbrellaId)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Return station not found",
    });

    expect(mockReturnUmbrella).not.toHaveBeenCalled();
  });

  test("throws 409 when return station is full", async () => {
    const start = await rentalService.startRental("s1", "station-001");
    mockGetByStationId.mockResolvedValueOnce({
      station_id: "station-002",
      capacity: 10,
      num_brellas: 10,
      status: "operational",
    });

    await expect(
      rentalService.endRental("s1", start.rentalId, "station-002", start.umbrellaId)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Return station is full",
    });

    expect(mockReturnUmbrella).not.toHaveBeenCalled();
  });
});