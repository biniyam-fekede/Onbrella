import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRental } from "../context/RentalContext";
import { formatDurationFromStart } from "../utils/duration";
import { StationMap } from "../components/StationMap";
import * as api from "../api/client";

export function ActivePage() {
  const navigate = useNavigate();
  const { activeRental, endRental, lastReturnSummary } = useRental();
  const mapRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState("00:00:00");
  const [stations, setStations] = useState([]);
  const [routeTo, setRouteTo] = useState(null);
  const [isTimerCollapsed, setIsTimerCollapsed] = useState(false);

  const hasValidRental = activeRental && typeof activeRental === "object" && activeRental.startTime;

  const formatGeoError = (err) => {
    if (!err) return "Unable to access your location.";
    if (err.code === 1)
      return "Location permission denied. Enable location access for this site to use navigation.";
    if (err.code === 2) return "Location unavailable. Check GPS/network and try again.";
    if (err.code === 3) return "Location request timed out. Try again.";
    return err.message || "Unable to access your location.";
  };

  // Access only during active rental: redirect if none
  useEffect(() => {
    if (!hasValidRental) {
      navigate(lastReturnSummary ? "/thank-you" : "/", { replace: true });
    }
  }, [hasValidRental, lastReturnSummary, navigate]);

  useEffect(() => {
    if (!hasValidRental) return;
    const tick = () => setDuration(formatDurationFromStart(activeRental.startTime));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasValidRental, activeRental?.startTime]);

  useEffect(() => {
    api
      .getStations()
      .then((data) => setStations(data.stations || []))
      .catch(() => setStations([]));
  }, []);

  const handleStationClick = useCallback((station) => {
    const lat = station.location?.latitude;
    const lng = station.location?.longitude;
    if (lat != null && lng != null) {
      mapRef.current?.setView?.([lat, lng]);
      setRouteTo([lat, lng]);
    }
  }, []);

  const filteredStations = stations;

  const goToMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser/device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapRef.current?.setView?.([lat, lng]);
      },
      (err) => setError(formatGeoError(err)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  };

  if (!hasValidRental) {
    return null;
  }

  const circumference = 2 * Math.PI * 88;
  const elapsed = (Date.now() - new Date(activeRental.startTime).getTime()) / 1000;
  const maxSeconds = 24 * 3600;
  const progress = Math.min(1, elapsed / maxSeconds);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 bg-background-light dark:bg-background-dark overflow-hidden h-screen w-full">
      {/* Map background with stations (no availability, click = pan to station) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-primary/10 pointer-events-none z-[1]" />
        <StationMap
          stations={filteredStations}
          mapRef={mapRef}
          simplified
          onSelectStation={handleStationClick}
          routeTo={routeTo}
        />
      </div>

      {/* Navigation arrow: same logic as Map page – bottom-right, above bottom sheet */}
      <div
        className={`fixed right-4 z-30 transition-[bottom] duration-300 ease-out ${
          isTimerCollapsed ? "bottom-24" : "bottom-[52vh]"
        }`}
      >
        {routeTo && (
          <button
            type="button"
            onClick={() => setRouteTo(null)}
            className="w-12 h-12 mb-3 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform border border-slate-100 dark:border-slate-700"
            aria-label="Clear route"
          >
            <span className="material-icons text-red-500">close</span>
          </button>
        )}
        <button
          type="button"
          onClick={goToMyLocation}
          className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform border border-slate-100 dark:border-slate-700"
          aria-label="Center on my location"
        >
          <span className="material-icons text-primary">navigation</span>
        </button>
      </div>

      {/* Collapsible timer sheet */}
      {isTimerCollapsed ? (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-3">
          <button
            type="button"
            onClick={() => setIsTimerCollapsed(false)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-xl flex items-center gap-1.5 active:scale-95 transition-transform"
            aria-label="Expand timer panel"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">keyboard_arrow_up</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Show timer</span>
          </button>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl px-6 pt-2 pb-12 border-t border-slate-200 dark:border-slate-800 relative">
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setIsTimerCollapsed(true)}
                className="w-12 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Collapse timer panel"
              >
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[22px]">
                  keyboard_arrow_down
                </span>
              </button>
            </div>
          <div className="flex justify-center mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Rental Active
            </div>
          </div>
          <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-6">
            Enjoy your journey!
          </h2>
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-8 border-slate-100 dark:border-slate-800" />
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle
                  className="text-primary"
                  cx="96"
                  cy="96"
                  fill="none"
                  r="88"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="8"
                />
              </svg>
              <div
                className="absolute top-0 w-4 h-4 bg-primary rounded-full border-4 border-white dark:border-slate-900 shadow-sm"
                style={{ transform: "translateY(-4px)" }}
              />
              <div className="text-center z-10">
                <div className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {duration}
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-1">
                  Duration
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (status === "loading") return;
              setError(null);
              navigate("/scan/return");
            }}
            disabled={status === "loading"}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined rotate-180">keyboard_return</span>
            {status === "loading" ? "Returning…" : "Return Umbrella"}
          </button>
          {error && (
            <p className="text-sm text-center text-red-500 mt-3">{error}</p>
          )}
        </div>
        </div>
      )}

      {/* Top gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-[60]" />
      {/* Bottom pill */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/20 dark:bg-white/20 rounded-full z-[100] pointer-events-none" />
    </div>
  );
}
