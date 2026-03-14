import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "operational", label: "Operational" },
  { value: "out_of_service", label: "Out of service" },
  { value: "maintenance", label: "Maintenance" },
];

/**
 * Form to create or update a station. Modular: receives onSubmit (API call) and onSuccess/onCancel.
 */
export function AddStationForm({ onSubmit, onSuccess, onCancel, isSubmitting = false }) {
  const [stationId, setStationId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [status, setStatus] = useState("operational");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      stationId: stationId.trim(),
      capacity: Number(capacity),
      status,
    };
    if (name.trim() !== "") payload.name = name.trim();
    if (latitude.trim() !== "") payload.latitude = Number(latitude);
    if (longitude.trim() !== "") payload.longitude = Number(longitude);

    if (!payload.stationId) {
      setError("Station ID is required.");
      return;
    }
    if (!Number.isInteger(payload.capacity) || payload.capacity < 1) {
      setError("Capacity must be a positive integer.");
      return;
    }

    try {
      await onSubmit(payload);
      onSuccess?.();
    } catch (err) {
      setError(err.message || err.payload?.error || "Failed to save station");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="station-id" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Station ID *
        </label>
        <input
          id="station-id"
          type="text"
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
          placeholder="e.g. station-006"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 focus:border-uw-primary outline-none"
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="station-name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Station name (optional)
        </label>
        <input
          id="station-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Suzzallo Library Station"
          maxLength={256}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 focus:border-uw-primary outline-none"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="capacity" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Capacity *
        </label>
        <input
          id="capacity"
          type="number"
          min={1}
          max={9999}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="10"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-uw-primary/50 focus:border-uw-primary outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="latitude" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Latitude (for map)
          </label>
          <input
            id="latitude"
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
          <label htmlFor="longitude" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Longitude (for map)
          </label>
          <input
            id="longitude"
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
        <label htmlFor="status" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-uw-primary/50 focus:border-uw-primary outline-none"
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
          {isSubmitting ? "Saving…" : "Add station"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
