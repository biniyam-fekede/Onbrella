jest.mock("../src/store/getRentalStore", () => jest.fn());

const getRentalStore = require("../src/store/getRentalStore");
const {
  getRentalTrends,
  buildEmptyTrendBuckets,
  normalizeTrendHours,
} = require("../src/services/rentalTrendService");

describe("rentalTrendService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normalizeTrendHours clamps invalid values to supported defaults", () => {
    expect(normalizeTrendHours()).toBe(24);
    expect(normalizeTrendHours(0)).toBe(24);
    expect(normalizeTrendHours(-3)).toBe(24);
    expect(normalizeTrendHours(12.9)).toBe(12);
    expect(normalizeTrendHours(999)).toBe(168);
  });

  test("buildEmptyTrendBuckets returns the requested number of zero-count buckets", () => {
    const buckets = buildEmptyTrendBuckets(4, new Date("2026-03-07T10:37:22.000Z"));

    expect(buckets).toHaveLength(4);
    expect(buckets.map((bucket) => bucket.count)).toEqual([0, 0, 0, 0]);
    expect(buckets.map((bucket) => bucket.bucketStart)).toEqual([
      "2026-03-07T07:00:00.000Z",
      "2026-03-07T08:00:00.000Z",
      "2026-03-07T09:00:00.000Z",
      "2026-03-07T10:00:00.000Z",
    ]);
  });

  test("getRentalTrends returns store-provided buckets when available", async () => {
    const buckets = [
      { bucketStart: "2026-03-07T08:00:00.000Z", count: 2 },
      { bucketStart: "2026-03-07T09:00:00.000Z", count: 5 },
    ];
    getRentalStore.mockReturnValue({
      listTrendBuckets: jest.fn().mockResolvedValue(buckets),
    });

    const result = await getRentalTrends({ hours: 2 });

    expect(getRentalStore).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ hours: 2, buckets });
  });

  test("getRentalTrends falls back to empty buckets when the store is unavailable", async () => {
    getRentalStore.mockImplementation(() => {
      throw new Error("Database not configured");
    });

    const result = await getRentalTrends({ hours: 3 });

    expect(result.hours).toBe(3);
    expect(result.buckets).toHaveLength(3);
    expect(result.buckets.every((bucket) => bucket.count === 0)).toBe(true);
  });
});
