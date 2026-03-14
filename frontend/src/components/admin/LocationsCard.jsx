/**
 * Locations card — shows station/location list. No fetching; data passed via props.
 * @param {Array<{ stationId: string, name?: string, address?: string }>} locations
 * @param {string} [title]
 */
export function LocationsCard({
  locations = [],
  title = "UW Managed Locations",
}) {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">{title}</h3>
      {locations.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No locations to display.</p>
      ) : (
        <ul className="space-y-3">
          {locations.map((loc) => (
            <li
              key={loc.stationId}
              className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
            >
              <span className="material-symbols-outlined text-slate-400 text-lg shrink-0 mt-0.5">
                location_on
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {loc.name || loc.stationId}
                </p>
                {loc.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{loc.address}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
