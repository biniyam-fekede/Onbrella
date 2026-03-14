import { useCallback, useEffect, useState, useMemo } from "react";
import { adminGetActivity, adminGetReports, adminGetRentalTrends } from "../../api/adminClient";
import { RentalTrendsCard } from "../../components/admin";
import { getStationDisplayName } from "../../utils/stationNames";

const FILTER_ALL = "all";
const FILTER_RENTALS = "rentals";
const FILTER_ALERTS = "alerts";

function formatTimeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { dateStyle: "short" });
}

function formatDateHeader(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function AdminActivityPage() {
  const [activities, setActivities] = useState([]);
  const [reports, setReports] = useState([]);
  const [trendBuckets, setTrendBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(FILTER_ALL);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [actRes, repRes, trendRes] = await Promise.all([
        adminGetActivity(50).catch(() => ({ activities: [] })),
        adminGetReports().catch(() => ({ reports: [] })),
        adminGetRentalTrends(24).catch(() => ({ buckets: [] })),
      ]);
      setActivities(actRes.activities || []);
      setReports(repRes.reports || []);
      setTrendBuckets(trendRes.buckets || []);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Build feed items: rental events (start + return) and report events, sorted by time
  const feedItems = useMemo(() => {
    const items = [];
    activities.forEach((r) => {
      const userLabel = r.userFullName || r.userEmail || "User";
      const stationName = getStationDisplayName(r.stationId);
      const returnStationName = r.returnStationId
        ? getStationDisplayName(r.returnStationId)
        : null;
      if (r.status === "COMPLETED" && r.endTime) {
        items.push({
          id: `return-${r.rentalId}`,
          type: "return",
          time: r.endTime,
          title: "Umbrella returned",
          subtitle: `Station: ${returnStationName || r.returnStationId} • Umbrella ${(r.umbrellaId || "").replace("umbrella-", "#")}`,
          icon: "login",
          iconBg: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
        });
      }
      items.push({
        id: `rent-${r.rentalId}`,
        type: "rent",
        time: r.startTime,
        title: `${userLabel} rented`,
        subtitle: `Station: ${stationName} • Umbrella ${(r.umbrellaId || "").replace("umbrella-", "#")}`,
        icon: "logout",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
      });
    });
    reports.forEach((r) => {
      items.push({
        id: `report-${r.id}`,
        type: "report",
        time: r.createdAt,
        title: r.reasonLabel || r.message || `Report #${r.id}`,
        subtitle: r.stationId
          ? `Station: ${getStationDisplayName(r.stationId)}`
          : r.details || "",
        status: r.status,
        source: r.source || "legacy_report",
        severity: r.severity || "critical",
        icon: r.status === "open" ? "error" : "build",
        iconBg: r.status === "open" ? "bg-rose-100 dark:bg-rose-900/30" : "bg-purple-100 dark:bg-purple-900/30",
        iconColor: r.status === "open" ? "text-rose-600 dark:text-rose-400" : "text-purple-600 dark:text-purple-400",
        isCritical: r.status === "open" && (r.severity || "critical") === "critical",
      });
    });
    items.sort((a, b) => new Date(b.time) - new Date(a.time));
    return items;
  }, [activities, reports]);

  const filteredItems = useMemo(() => {
    if (filter === FILTER_ALL) return feedItems;
    if (filter === FILTER_RENTALS) return feedItems.filter((i) => i.type === "rent" || i.type === "return");
    if (filter === FILTER_ALERTS) {
      return feedItems.filter(
        (i) => i.type === "report" && i.source === "support_request"
      );
    }
    return feedItems;
  }, [feedItems, filter]);

  // Group by date for section headers
  const grouped = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const key = item.time ? new Date(item.time).toDateString() : "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).map(([dateKey, list]) => ({
      dateKey,
      label: formatDateHeader(list[0]?.time) || dateKey,
      items: list,
    }));
  }, [filteredItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Loading activity…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-300">{error}</div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        <button
          type="button"
          onClick={() => setFilter(FILTER_ALL)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
            filter === FILTER_ALL
              ? "bg-uw-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          All Events
        </button>
        <button
          type="button"
          onClick={() => setFilter(FILTER_RENTALS)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
            filter === FILTER_RENTALS
              ? "bg-uw-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Rentals
        </button>
        <button
          type="button"
          onClick={() => setFilter(FILTER_ALERTS)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
            filter === FILTER_ALERTS
              ? "bg-uw-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Alerts
        </button>
      </div>

      {filter === FILTER_RENTALS && (
        <RentalTrendsCard
          buckets={trendBuckets}
          title="Rental Trends"
          periodLabel="Last 24 Hours"
        />
      )}

      {grouped.length === 0 && filter !== FILTER_RENTALS ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          No activity to display.
        </div>
      ) : grouped.length > 0 ? (
        grouped.map(({ dateKey, label, items }) => (
          <div key={dateKey} className="space-y-3">
            <div className="sticky top-0 z-30 py-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {label}
              </p>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 border flex gap-4 items-start shadow-sm ${
                  item.isCritical
                    ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30"
                    : "bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  <span className={`material-symbols-outlined ${item.iconColor}`}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {formatTimeAgo(item.time)}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p
                      className={`text-xs mt-0.5 ${
                        item.isCritical
                          ? "text-rose-600 dark:text-rose-400 font-medium italic"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : null}

      <div className="pt-10 pb-4 flex justify-center">
        <div className="w-32 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  );
}
