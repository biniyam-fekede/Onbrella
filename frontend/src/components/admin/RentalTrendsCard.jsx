/**
 * Rental trends graph card. Accepts chart-ready hourly buckets from the backend.
 * No fetching or aggregation happens here.
 * @param {Array<{ bucketStart: string, count: number }>} buckets - Oldest-to-newest hourly buckets
 * @param {string} [title] - Card title
 * @param {string} [periodLabel] - e.g. "Last 24 Hours"
 */
export function RentalTrendsCard({ buckets = [], title = "Rental Trends", periodLabel = "Last 24 Hours" }) {
  const fallbackBuckets = Array.from({ length: 24 }, (_, index) => ({
    bucketStart: null,
    count: 0,
    key: `fallback-${index}`,
  }));
  const chartBuckets = Array.isArray(buckets) && buckets.length > 0 ? buckets : fallbackBuckets;
  const counts = chartBuckets.map((bucket) => Number(bucket?.count) || 0);
  const max = Math.max(1, ...counts);
  const tickIndexes =
    chartBuckets.length > 1
      ? [
          0,
          Math.floor((chartBuckets.length - 1) * 0.25),
          Math.floor((chartBuckets.length - 1) * 0.5),
          Math.floor((chartBuckets.length - 1) * 0.75),
          chartBuckets.length - 1,
        ]
      : [0, 0, 0, 0, 0];
  const formatHourLabel = (value) => {
    if (!value) return "--:--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-sm">{title}</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {periodLabel}
        </span>
      </div>
      <div className="flex items-end justify-between h-32 gap-0.5 px-1">
        {chartBuckets.map((bucket, i) => (
          <div
            key={bucket.bucketStart || bucket.key || i}
            className="flex-1 min-w-0 rounded-t-sm bg-uw-primary/80 hover:bg-uw-primary transition-colors"
            style={{ height: `${((Number(bucket?.count) || 0) / max) * 100}%`, minHeight: bucket?.count ? "4px" : "0" }}
            title={`${formatHourLabel(bucket?.bucketStart)} - ${Number(bucket?.count) || 0} rental(s)`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 px-1 text-[9px] text-slate-400 font-medium">
        {tickIndexes.map((index, tickIndex) => (
          <span key={`${index}-${tickIndex}`}>{formatHourLabel(chartBuckets[index]?.bucketStart)}</span>
        ))}
      </div>
    </div>
  );
}
