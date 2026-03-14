import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRentalHistory } from "../api";
import { config } from "../config";
import { getStationDisplayName } from "../utils/stationNames";

/**
 * Format rental date for header: "Today, Oct 24" or "Oct 22, 2023"
 */
function formatRentalDate(iso) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const now = new Date();
  const isToday =
    d.getUTCDate() === now.getUTCDate() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCFullYear() === now.getUTCFullYear();
  if (isToday) {
    return `Today, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format duration as "1h 20m" or "45m" or "22m"
 */
function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return "—";
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "—";
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function computeCost(startTime, endTime) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  const cents = (config.unlockFeeCents || 0) + minutes * (config.centsPerMinute || 0);
  return (cents / 100).toFixed(2);
}

/**
 * Rental history page — timeline-style list of completed rentals.
 *
 * Fetches from GET /api/history (same session as rent/return via X-Session-Id).
 * Refetches when the tab becomes visible. Shows Back to map, empty/error states, and Try again.
 */
export function HistoryPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getRentalHistory({ limit: 50, offset: 0 });
      setRentals(data.rentals || []);
    } catch (err) {
      const status = err.status;
      const msg = err.message || "Failed to load history";
      if (status === 404) {
        setError(
          "History API not found (404). Start the backend: in the backend folder run npm start."
        );
      } else if (msg === "Failed to fetch" || msg.includes("fetch")) {
        setError(
          "Cannot reach the backend (failed to fetch). Start the backend (cd backend && npm start), then run the frontend with npm run dev so /api is proxied to the backend."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadHistory(false);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadHistory]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-28 overflow-y-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-medium text-sm mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to map
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight px-1 text-slate-900 dark:text-white">
            Rental History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm px-1 mt-0.5">
            Your past 30 days of activity
          </p>
        </header>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading history…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-sm text-red-500 dark:text-red-400 mb-2 font-medium">{error}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
              For local dev: run the backend from the project root with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">cd backend && npm start</code>, then run the frontend with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">npm run dev</code>. Use the same browser tab where you rented and returned.
            </p>
            <button
              type="button"
              onClick={() => loadHistory(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && rentals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-icons text-3xl text-slate-400">history</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No rentals yet</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center max-w-xs">
              When you complete rentals in this browser, they&apos;ll show up here with duration, cost, and stations. Use the same tab where you rented and returned.
            </p>
            <button
              type="button"
              onClick={() => loadHistory(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && rentals.length > 0 && (
          <div className="space-y-4">
            {rentals.map((rental) => {
              const cost = computeCost(rental.startTime, rental.endTime);
              const durationStr = formatDuration(rental.startTime, rental.endTime);
              const pickUpName = getStationDisplayName(rental.stationId);
              const returnName = rental.returnStationId
                ? getStationDisplayName(rental.returnStationId)
                : "—";

              return (
                <div
                  key={rental.rentalId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {formatRentalDate(rental.startTime)}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {cost ? `$${cost}` : "—"}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                        <div className="w-2 h-2 rounded-full border-2 border-primary bg-transparent" />
                      </div>
                      <div className="flex-1 space-y-4 min-w-0">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                            Picked up
                          </p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {pickUpName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                            Returned
                          </p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {returnName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                          Duration
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {durationStr}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
