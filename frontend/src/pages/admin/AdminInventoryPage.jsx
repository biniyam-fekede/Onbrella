import { useCallback, useEffect, useState } from "react";
import {
  adminGetStations,
  adminCreateStation,
  adminUpdateStationStatus,
  adminUpdateStation,
  adminDeleteStation,
  adminGetPricing,
  adminUpdatePricing,
} from "../../api/adminClient";
import { getStationDisplayName } from "../../utils/stationNames";
import {
  AddStationForm,
  StationStatusModal,
  StationEditModal,
  PricingCard,
} from "../../components/admin";

const NON_OPERATIONAL_STATUSES = ["out_of_service", "maintenance"];

export function AdminInventoryPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stationForStatus, setStationForStatus] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [stationForEdit, setStationForEdit] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pricing, setPricing] = useState({ unlockFeeCents: 0, centsPerMinute: 0 });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  const loadStations = useCallback(() => {
    return adminGetStations()
      .then((res) => setStations(res.stations || []))
      .catch((e) => setError(e.message || "Failed to load stations"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPricingError(null);

    Promise.allSettled([loadStations(), adminGetPricing()])
      .then(([stationsResult, pricingResult]) => {
        if (cancelled) return;

        if (stationsResult.status === "rejected") {
          setError(stationsResult.reason?.message || "Failed to load inventory");
        }

        if (pricingResult.status === "fulfilled") {
          setPricing(pricingResult.value);
        } else {
          setPricingError(
            pricingResult.reason?.message ||
              "Failed to load pricing from the backend. Showing the local default values."
          );
          setPricing({ unlockFeeCents: 100, centsPerMinute: 10 });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadStations]);

  const handleCreateStation = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      await adminCreateStation(payload);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleAddSuccess = useCallback(() => {
    setShowAddForm(false);
    loadStations();
  }, [loadStations]);

  const handleStatusUpdate = useCallback(async (status) => {
    if (!stationForStatus) return;
    setStatusSubmitting(true);
    try {
      await adminUpdateStationStatus(stationForStatus.stationId, status);
      loadStations();
    } finally {
      setStatusSubmitting(false);
    }
  }, [stationForStatus, loadStations]);

  const handleOpenSettings = useCallback(() => {
    if (stationForStatus) {
      setStationForEdit(stationForStatus);
      setStationForStatus(null);
    }
  }, [stationForStatus]);

  const handleEditSave = useCallback(
    async (payload) => {
      if (!stationForEdit) return;
      setEditSubmitting(true);
      try {
        await adminUpdateStation(stationForEdit.stationId, payload);
        loadStations();
      } finally {
        setEditSubmitting(false);
      }
    },
    [stationForEdit, loadStations]
  );

  const handleEditDelete = useCallback(async () => {
    if (!stationForEdit) return;
    await adminDeleteStation(stationForEdit.stationId);
    loadStations();
  }, [stationForEdit, loadStations]);

  const handleSavePricing = async (newPricing) => {
    setPricingError(null);
    setPricingLoading(true);
    try {
      const updated = await adminUpdatePricing(newPricing.unlockFeeCents, newPricing.centsPerMinute);
      setPricing(updated);
    } catch (err) {
      setPricingError(err.message || "Failed to save pricing");
    } finally {
      setPricingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Loading inventory…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-300">{error}</div>
    );
  }

  // Exclude bad/test rows (e.g. station_id "134" with wrong capacity)
  const displayStations = stations.filter((s) => s.stationId !== "134");
  const isOperational = (s) =>
    (s.status || "operational").toLowerCase().replace(/\s+/g, "_") === "operational";

  const { totalAvailable, totalCapacity } = displayStations.filter(isOperational).reduce(
    (acc, s) => {
      const cap = s.capacity ?? 0;
      const avail = s.numUmbrellas != null ? s.numUmbrellas : cap;
      return {
        totalAvailable: acc.totalAvailable + avail,
        totalCapacity: acc.totalCapacity + cap,
      };
    },
    { totalAvailable: 0, totalCapacity: 0 }
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-uw-primary text-white px-5 py-3 text-sm font-semibold hover:bg-uw-primary/90 transition-opacity shadow-sm order-first sm:order-none"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Add station
        </button>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Across all stations
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {totalAvailable} available / {totalCapacity} capacity
          </p>
          <span className="text-xs text-slate-400 font-medium ml-auto">
            {displayStations.length} station{displayStations.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <PricingCard
        pricing={pricing}
        onSave={handleSavePricing}
        saving={pricingLoading}
        error={pricingError}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white px-1">
          UW Managed Locations
        </h3>
        {displayStations.length === 0 && !showAddForm ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
            No stations in the database. Add one with the button above.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayStations.map((s) => {
              const statusNorm = (s.status || "operational").toLowerCase().replace(/\s+/g, "_");
              const isNonOperational = NON_OPERATIONAL_STATUSES.includes(statusNorm);
              return (
                <button
                  key={s.stationId}
                  type="button"
                  onClick={() => setStationForStatus(s)}
                  className={`rounded-2xl p-4 border shadow-sm text-left transition-all focus:outline-none focus:ring-2 ${
                    isNonOperational
                      ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 hover:border-red-400 dark:hover:border-red-700 focus:ring-red-500/50"
                      : "bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-uw-primary/30 hover:shadow-md focus:ring-uw-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ${
                        isNonOperational ? "bg-red-500" : "bg-slate-200 dark:bg-slate-600"
                      }`}
                      title={isNonOperational ? "Out of service or maintenance" : "Operational"}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isNonOperational ? "text-red-900 dark:text-red-200" : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {s.name || getStationDisplayName(s.stationId)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {s.numUmbrellas != null
                          ? `${s.numUmbrellas} available`
                          : s.capacity != null
                            ? `Capacity ${s.capacity}`
                            : "—"}
                        {s.capacity != null && s.numUmbrellas != null
                          ? ` / ${s.capacity} capacity`
                          : ""}
                      </p>
                      {s.status && statusNorm !== "operational" && (
                        <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1 capitalize">
                          {String(s.status).replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {stationForStatus && (
        <StationStatusModal
          stationName={stationForStatus.name || getStationDisplayName(stationForStatus.stationId)}
          currentStatus={stationForStatus.status || "operational"}
          onSelect={handleStatusUpdate}
          onClose={() => setStationForStatus(null)}
          onOpenSettings={handleOpenSettings}
          isSubmitting={statusSubmitting}
        />
      )}

      {stationForEdit && (
        <StationEditModal
          station={stationForEdit}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          onClose={() => setStationForEdit(null)}
          isSubmitting={editSubmitting}
        />
      )}

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-station-title"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-2">
              <h2 id="add-station-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Add station
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saves to the database permanently. Add latitude and longitude for the station to appear on the map for users.
              </p>
            </div>
            <div className="px-5 pb-5">
              <AddStationForm
                onSubmit={handleCreateStation}
                onSuccess={handleAddSuccess}
                onCancel={() => setShowAddForm(false)}
                isSubmitting={submitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
