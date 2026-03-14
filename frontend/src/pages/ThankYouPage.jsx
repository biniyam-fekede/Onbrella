import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRental } from "../context/RentalContext";
import { formatDurationMs } from "../utils/duration";
import { formatCost } from "../utils/cost";
import { getStationDisplayName } from "../utils/stationNames";

export function ThankYouPage() {
  const navigate = useNavigate();
  const { lastReturnSummary, clearLastReturnSummary } = useRental();

  useEffect(() => {
    if (!lastReturnSummary) navigate("/", { replace: true });
  }, [lastReturnSummary, navigate]);

  const handleBackToMap = () => {
    clearLastReturnSummary();
    navigate("/", { replace: true });
  };

  if (!lastReturnSummary) return null;

  const durationFormatted = formatDurationMs(lastReturnSummary.durationMs);
  const costCents = lastReturnSummary.costCents;

  const pickUpName =
    lastReturnSummary.pickUpStationName ||
    getStationDisplayName(lastReturnSummary.pickUpStationId);

  const returnName =
    lastReturnSummary.returnStationName ||
    getStationDisplayName(lastReturnSummary.returnStationId);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-32">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
            <span className="material-symbols-outlined text-6xl text-primary">umbrella</span>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white border-4 border-background-light dark:border-background-dark">
              <span className="material-icons text-sm">check</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white px-4">
            Thank you for using On-Brella!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Your rental has been successfully returned.
          </p>
        </div>

        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-8">
          <div className="flex flex-col items-center gap-1 border-b border-slate-50 dark:border-slate-800 pb-6">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Total Cost
            </span>
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCost(costCents)}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Total Duration
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{durationFormatted}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-6 top-10 bottom-10 w-[2px] bg-slate-100 dark:bg-slate-800" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">pin_drop</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Pick-up
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{pickUpName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">where_to_vote</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Return
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{returnName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mt-auto pb-6 pt-8">
          <button
            type="button"
            onClick={handleBackToMap}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-icons text-xl">map</span>
            Back to Map
          </button>
        </div>
      </main>
    </div>
  );
}
