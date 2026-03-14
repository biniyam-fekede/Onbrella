import { getStationDisplayName, getStationAddress } from "../utils/stationNames";
import { useNavigate } from "react-router-dom";

export function StationBottomSheet({ station, onRent, onClose }) {
  const navigate = useNavigate();
  if (!station) return null;

  const name = getStationDisplayName(station.stationId);
  const address = getStationAddress(station.stationId);
  const statusNorm = (station.status || "operational").toLowerCase().replace(/\s+/g, "_");
  const isNonOperational = statusNorm === "out_of_service" || statusNorm === "maintenance";
  const issueMessage =
    statusNorm === "maintenance"
      ? "This station is currently under maintenance. Please use another station for now."
      : "This station is currently out of service. Please use another station for now.";
  const available = station.numUmbrellas ?? 0;
  const capacity = station.capacity ?? 0;
  const emptySlots = station.availableSlots ?? Math.max(0, capacity - available);

  const handleRent = () => {
    onRent?.(station);
    navigate("/scan", { state: { station, mode: "rent" } });
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] px-5 pt-3 pb-28">
      <button
        type="button"
        onClick={onClose}
        className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 block"
        aria-label="Close"
      />
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
          {address && (
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="material-icons text-xs">location_on</span>
              {address}
            </p>
          )}
        </div>
      </div>
      {isNonOperational ? (
        <>
          <div className="my-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-[20px] leading-none">settings</span>
              <p className="text-sm font-medium leading-6">{issueMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl transition-all"
          >
            Close
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                Available
              </span>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                  {available}
                </span>
                <span className="text-sm text-slate-400 font-medium mb-0.5">/ {capacity} total</span>
              </div>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                Empty Slots
              </span>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                  {emptySlots}
                </span>
                <span className="text-sm text-slate-400 font-medium mb-0.5">for returns</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRent}
              className="flex-[2] bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-icons">qr_code_scanner</span>
              Rent Umbrella
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
