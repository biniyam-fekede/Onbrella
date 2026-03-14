import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "operational", label: "Operational", icon: "check_circle" },
  { value: "out_of_service", label: "Out of service", icon: "cancel" },
  { value: "maintenance", label: "Maintenance", icon: "build" },
];

/**
 * Modal to change a station's status. Call onSelect(status) when user picks an option.
 * Optional onOpenSettings opens the edit/settings view for this station.
 */
export function StationStatusModal({
  stationName,
  currentStatus,
  onSelect,
  onClose,
  onOpenSettings,
  isSubmitting,
}) {
  const [error, setError] = useState(null);

  const handleSelect = async (status) => {
    setError(null);
    try {
      await onSelect(status);
      onClose?.();
    } catch (err) {
      setError(err.message || err.payload?.error || "Failed to update status");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-status-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-2">
          <h2 id="station-status-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Change status
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {stationName}
          </p>
        </div>
        {error && (
          <div className="mx-5 mt-2 rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="p-5 space-y-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
                currentStatus === opt.value
                  ? "border-uw-primary bg-uw-primary/10 text-uw-primary dark:text-uw-secondary"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{opt.icon}</span>
              {opt.label}
              {currentStatus === opt.value && (
                <span className="ml-auto text-xs font-semibold">Current</span>
              )}
            </button>
          ))}
        </div>
        <div className="px-5 pb-5 space-y-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                onClose?.();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              Settings (edit name, location, delete)
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
