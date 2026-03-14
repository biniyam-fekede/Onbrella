/**
 * Admin dashboard rental trend service.
 * Keeps route handlers thin and always returns chart-ready hourly buckets.
 */

const getRentalStore = require("../store/getRentalStore");

const DEFAULT_TREND_HOURS = 24;
const MAX_TREND_HOURS = 24 * 7;
const ONE_HOUR_MS = 60 * 60 * 1000;

function normalizeTrendHours(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TREND_HOURS;
  const wholeHours = Math.floor(parsed);
  if (wholeHours < 1) return DEFAULT_TREND_HOURS;
  return Math.min(wholeHours, MAX_TREND_HOURS);
}

function buildEmptyTrendBuckets(hours = DEFAULT_TREND_HOURS, now = new Date()) {
  const bucketCount = normalizeTrendHours(hours);
  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);

  return Array.from({ length: bucketCount }, (_, index) => {
    const hoursAgo = bucketCount - index - 1;
    const bucketStart = new Date(currentHourStart.getTime() - hoursAgo * ONE_HOUR_MS);
    return {
      bucketStart: bucketStart.toISOString(),
      count: 0,
    };
  });
}

async function getRentalTrends({ hours = DEFAULT_TREND_HOURS } = {}) {
  const safeHours = normalizeTrendHours(hours);

  try {
    const store = getRentalStore();
    const buckets = await store.listTrendBuckets(safeHours);
    return {
      hours: safeHours,
      buckets: Array.isArray(buckets) && buckets.length > 0 ? buckets : buildEmptyTrendBuckets(safeHours),
    };
  } catch {
    return {
      hours: safeHours,
      buckets: buildEmptyTrendBuckets(safeHours),
    };
  }
}

module.exports = {
  DEFAULT_TREND_HOURS,
  MAX_TREND_HOURS,
  normalizeTrendHours,
  buildEmptyTrendBuckets,
  getRentalTrends,
};
