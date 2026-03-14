import { useEffect, useState } from "react";
import { RentalTrendsCard, StatsCards, LocationsCard } from "../../components/admin";
import { adminGetStats, adminGetRentalTrends, adminGetStations } from "../../api/adminClient";
import { getStationDisplayName, getStationAddress } from "../../utils/stationNames";

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalCapacity: 0,
    activeSessions: 0,
    criticalAlerts: 0,
  });
  const [trendBuckets, setTrendBuckets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const [statsRes, trendsRes, stationsRes] = await Promise.all([
          adminGetStats().catch((e) => ({
            totalUmbrellas: null,
            activeRentalsCount: 0,
            openReportsCount: 0,
            openCriticalReportsCount: 0,
          })),
          adminGetRentalTrends(24).catch(() => ({ buckets: [] })),
          adminGetStations().catch(() => ({ stations: [] })),
        ]);
        const stationsList = stationsRes.stations || [];
        const displayStations = stationsList.filter((s) => s.stationId !== "134");
        const isOperational = (s) =>
          (s.status || "operational").toLowerCase().replace(/\s+/g, "_") === "operational";
        const operationalStations = displayStations.filter(isOperational);

        if (cancelled) return;

        setTrendBuckets(trendsRes.buckets || []);

        const totalAvailable = operationalStations.reduce(
          (sum, st) => sum + (st.numUmbrellas != null ? st.numUmbrellas : st.capacity ?? 0),
          0
        );
        const totalCapacity = operationalStations.reduce(
          (sum, st) => sum + (st.capacity ?? 0),
          0
        );

        setStats({
          totalAvailable,
          totalCapacity,
          activeSessions: statsRes.activeSessions ?? 0,
          criticalAlerts:
            statsRes.openCriticalReportsCount ?? statsRes.openReportsCount ?? 0,
        });

        const locs = displayStations.map((s) => ({
          stationId: s.stationId,
          name: s.name || getStationDisplayName(s.stationId),
          address: getStationAddress(s.stationId),
        }));
        setLocations(locs);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500 dark:text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-300 mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <StatsCards
        totalAvailable={stats.totalAvailable}
        totalCapacity={stats.totalCapacity}
        activeSessions={stats.activeSessions}
        criticalAlerts={stats.criticalAlerts}
      />

      <RentalTrendsCard
        buckets={trendBuckets}
        title="Rental Trends"
        periodLabel="Last 24 Hours"
      />

      <LocationsCard locations={locations} title="UW Managed Locations" />
    </div>
  );
}
