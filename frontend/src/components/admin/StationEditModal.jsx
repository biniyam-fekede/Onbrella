import { useState, useEffect } from "react";

const STATUS_OPTIONS = [
  { value: "operational", label: "Operational" },
  { value: "out_of_service", label: "Out of service" },
  { value: "maintenance", label: "Maintenance" },
];

/**
 * Modal to edit a station: name, location (lat/long), capacity, status. Includes Delete to remove from DB/map.
 */
export function StationEditModal({ station, onSave, onDelete, onClose, isSubmitting }) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("operational");
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (station) {
      setName(station.name ?? "");
      setLatitude(station.latitude != null ? String(station.latitude) : "");
      setLongitude(station.longitude != null ? String(station.longitude) : "");
      setCapacity(station.capacity != null ? String(station.capacity) : "");
      setStatus((station.status || "operational").toLowerCase().replace(/\s+/g, "_"));
    }
  }, [station]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {};
    const trimmedName = name.trim();
    if (trimmedName !== "") payload.name = trimmedName;
    else payload.name = null;
    const lat = latitude.trim() === "" ? null : Number(latitude);
    const lng = longitude.trim() === "" ? null : Number(longitude);
    if (lat != null && !Number.isNaN(lat)) payload.latitude = lat;
    else payload.latitude = null;
    if (lng != null && !Number.isNaN(lng)) payload.longitude = lng;
    else payload.longitude = null;
    const cap = capacity.trim() === "" ? null : Number(capacity);
    if (cap != null && Number.isInteger(cap) && cap >= 1) payload.capacity = cap;
    payload.status = status;

    try {
      await onSave(payload);
      onClose?.();
    } catch (err) {
      setError(err.message || err.payload?.error || "Failed to update station");
    }
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onDelete();
      onClose?.();
    } catch (err) {
      setError(err.message || err.payload?.error || "Failed to delete station");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!station) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-edit-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-2">
          <h2 id="station-edit-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Edit station
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {station.stationId}
          </p>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="edit-station-name"
                className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
              >
                Name
              </label>
              <input
                id="edit-station-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suzzallo Library Station"
                maxLength={256}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 focus:border-uw-primary outline-none"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-latitude"
                  className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Latitude
                </label>
                <input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="47.655"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-longitude"
                  className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Longitude
                </label>
                <input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-122.304"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-capacity"
                className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
              >
                Capacity
              </label>
              <input
                id="edit-capacity"
                type="number"
                min={1}
                max={9999}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="10"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="edit-status"
                className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
              >
                Status
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-uw-primary/50 outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-uw-primary text-white py-2.5 text-sm font-semibold hover:bg-uw-primary/90 disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 py-2.5 px-4 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Delete station
              </button>
            </div>
          </form>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Remove this station from the map and database? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
