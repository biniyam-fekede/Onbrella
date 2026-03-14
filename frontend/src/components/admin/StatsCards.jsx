import { Link } from "react-router-dom";

/**
 * Stat cards: Available/Capacity, Active Sessions (unavailable umbrellas = capacity − available), Critical Alerts.
 * No fetching — all values from props.
 */
export function StatsCards({
  totalAvailable = 0,
  totalCapacity = 0,
  activeSessions = 0,
  criticalAlerts = 0,
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">umbrella</span>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Umbrellas</p>
          <p className="text-xl font-bold">
            {Number(totalAvailable).toLocaleString()} available / {Number(totalCapacity).toLocaleString()} capacity
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">bolt</span>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Active Sessions</p>
          <p className="text-xl font-bold">{Number(activeSessions).toLocaleString()}</p>
        </div>
        <p className="text-[10px] text-slate-400 ml-auto">Umbrellas currently out</p>
      </div>

      <Link
        to="/admin/reports?tab=critical"
        className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm flex items-center gap-4 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
      >
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-rose-600 dark:text-rose-400">report</span>
        </div>
        <div>
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Critical Alerts</p>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-400">
            {Number(criticalAlerts).toLocaleString()}
          </p>
        </div>
        {criticalAlerts > 0 && (
          <span className="ml-auto text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
            View
          </span>
        )}
      </Link>
    </div>
  );
}
