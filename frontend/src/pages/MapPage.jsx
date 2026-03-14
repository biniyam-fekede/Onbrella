import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../api/client";
import { supabase } from "@/lib/supabase/client";
import { config } from "../config";
import { useHomeAnnouncement } from "../hooks/useHomeAnnouncement";
import { getAnnouncementSessionState, markAnnouncementSeen } from "../utils/announcementSession";
import { StationMap } from "../components/StationMap";
import { StationBottomSheet } from "../components/StationBottomSheet";

export function MapPage() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const announcement = useHomeAnnouncement();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  /** Squared distance (for ordering only) from user to station */
  const distanceSq = (s) => {
    if (!userLocation) return 0;
    const lat = s.location?.latitude;
    const lng = s.location?.longitude;
    if (lat == null || lng == null) return Infinity;
    const dLat = lat - userLocation.lat;
    const dLng = lng - userLocation.lng;
    return dLat * dLat + dLng * dLng;
  };

  const formatGeoError = (err) => {
    if (!err) return "Unable to access your location.";
    if (err.code === 1)
      return "Location permission denied. Enable location access for this site to use navigation.";
    if (err.code === 2) return "Location unavailable. Check GPS/network and try again.";
    if (err.code === 3) return "Location request timed out. Try again.";
    return err.message || "Unable to access your location.";
  };

  const loadStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const data = await api.getStations(accessToken ? { accessToken } : {});
      setStations(data.stations || []);
    } catch (e) {
      setError(e.message || "Failed to load stations");
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // Refetch stations when auth changes (e.g. after login) so location-scoped admins see their stations
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadStations();
    });
    return () => subscription?.unsubscribe();
  }, [loadStations]);

  useEffect(() => {
    if (!announcement.enabled || (!announcement.title && !announcement.message)) {
      setShowAnnouncement(false);
      return undefined;
    }

    const { dismissed, seen } = getAnnouncementSessionState(announcement);
    if (dismissed || seen) {
      setShowAnnouncement(false);
      return undefined;
    }

    setShowAnnouncement(true);
    markAnnouncementSeen(announcement);
    const timer = window.setTimeout(() => {
      setShowAnnouncement(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [announcement]);

  const filteredStations = userLocation
    ? [...stations].sort((a, b) => distanceSq(a) - distanceSq(b))
    : stations;

  const goToScan = () => navigate("/scan", { state: { mode: "rent" } });
  const goToMyLocation = () => mapRef.current?.goToUser?.();
  const centerNearestStation = () => {
    setError(null);
    if (!stations || stations.length === 0) {
      setError("No stations loaded yet.");
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser/device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        let best = null;
        let bestD = Infinity;
        for (const s of stations) {
          const slat = s.location?.latitude;
          const slng = s.location?.longitude;
          if (slat == null || slng == null) continue;
          const d = (slat - lat) * (slat - lat) + (slng - lng) * (slng - lng);
          if (d < bestD) {
            bestD = d;
            best = [slat, slng];
          }
        }
        if (!best) {
          setError("Couldn’t find any nearby stations with valid locations.");
          return;
        }
        mapRef.current?.setView?.(best);
      },
      (err) => setError(formatGeoError(err)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  };

  return (
    <div className="map-container relative h-[100dvh] bg-background-dark">
      <StationMap
        stations={filteredStations}
        selectedStationId={selectedStation?.stationId}
        onSelectStation={setSelectedStation}
        mapRef={mapRef}
      />

      {/* Account button: top-left, elegant white circular */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          to="/profile"
          className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform border border-slate-100 dark:border-slate-700 hover:shadow-xl"
          aria-label="Account"
        >
          <span className="material-icons text-primary text-[22px]">person_outline</span>
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-10">
        {error && (
          <p className="text-red-500 text-sm mt-2 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        {userLocation && (
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 flex items-center gap-2">
            <span>Nearest first</span>
            <button
              type="button"
              onClick={() => setUserLocation(null)}
              className="underline font-medium hover:text-primary"
            >
              Show all
            </button>
          </p>
        )}
      </div>

      {showAnnouncement && announcement.enabled && (announcement.title || announcement.message) && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="rounded-2xl border border-white/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {announcement.badge && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {announcement.badge}
                  </p>
                )}
                {announcement.title && (
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {announcement.title}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAnnouncement(false)}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Dismiss announcement"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {announcement.message && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {announcement.message}
              </p>
            )}
            {announcement.ctaLabel && announcement.ctaPath && (
              <button
                type="button"
                onClick={() => navigate(announcement.ctaPath)}
                className="mt-3 text-sm font-semibold text-primary hover:underline"
              >
                {announcement.ctaLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Find station and Scan buttons at bottom of screen */}
      <div className="fixed bottom-6 left-0 right-0 z-20 px-4 flex gap-3">
        <button
          type="button"
          onClick={centerNearestStation}
          className="flex-1 bg-white dark:bg-slate-800 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform border border-slate-100 dark:border-slate-700"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
          <span className="font-bold text-slate-800 dark:text-white text-[14px]">
            Find station
          </span>
        </button>
        <button
          type="button"
          onClick={goToScan}
          className="flex-1 bg-white dark:bg-slate-800 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform border border-slate-100 dark:border-slate-700"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">qr_code_scanner</span>
          <span className="font-bold text-slate-800 dark:text-white text-[14px]">Scan</span>
        </button>
      </div>

      {/* Navigation arrow: above Scan button, right-hand thumb zone; moves up when bottom sheet is open */}
      <div
        className={`fixed right-4 z-30 transition-[bottom] duration-300 ease-out ${
          selectedStation ? "bottom-[52vh]" : "bottom-[8.5rem]"
        }`}
      >
        <button
          type="button"
          onClick={goToMyLocation}
          className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform border border-slate-100 dark:border-slate-700"
          aria-label="Center on my location"
        >
          <span className="material-icons text-primary">navigation</span>
        </button>
      </div>

      {selectedStation && (
        <div className="pointer-events-auto">
          <StationBottomSheet
            station={selectedStation}
            onRent={() => {}}
            onClose={() => setSelectedStation(null)}
          />
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white dark:bg-slate-800 rounded-2xl px-6 py-4 font-semibold">
            Loading stations…
          </div>
        </div>
      )}
    </div>
  );
}
