import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QrScanner } from "../components/QrScanner";
import { useRental } from "../context/RentalContext";
import { getAllStations } from "../utils/stationNames";
import { createCheckoutSession } from "../api/client";

const boxSize = 260;
const cornerSize = 48;
const cornerWidth = 4;

// Parse QR content to { stationId }.
// Supports either plain text station ID or JSON with stationId/station_id.
function parseQrPayload(text) {
  try {
    const trimmed = (text || "").trim();

    if (!trimmed) return null;

    if (trimmed.startsWith("{")) {
      const obj = JSON.parse(trimmed);
      return {
        stationId: String(obj.stationId || obj.station_id || "").trim(),
      };
    }

    return {
      stationId: trimmed,
    };
  } catch {
    return null;
  }
}

export function ScanPage2({ error: propError = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { startRental, endRental, activeRental } = useRental();
  const isReturn = location.pathname === "/scan/return";

  const [cameraError, setCameraError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [validStationIds, setValidStationIds] = useState(new Set());

  useEffect(() => {
    getAllStations()
      .then((stations) => setValidStationIds(new Set((stations || []).map((s) => s.stationId))))
      .catch(() => setValidStationIds(new Set()));
  }, []);

  const shownError = cameraError || propError || error;

  const handleScan = useCallback(
    async (text) => {
      console.log("scanned text:", text);


      if (!text || status === "loading") return;
      const payload = parseQrPayload(text);
      if (!payload) {
        setError("Invalid QR code");
        return;
      }

      if (isReturn) {
        if (!activeRental) {
          setError("No active rental to return");
          return;
        }

        const stationId = (payload.stationId || "").trim();

        if (!stationId) {
          setError("Invalid QR code: no station ID");
          return;
        }

        if (validStationIds.size > 0 && !validStationIds.has(stationId)) {
          setError("Return station not found. Use a QR code from an On-Brella station.");
          return;
        }

        setError(null);
        setStatus("loading");

        try {
          await endRental(stationId);
          const payment = await createCheckoutSession(activeRental.rentalId);
          window.location.href = payment.checkoutUrl;
        } catch (e) {
          setError(e?.message || "Failed to return umbrella");
          setStatus("idle");
        }
        return;
      }

      // Rent flow: require a stationId that exists in our stations table (from API/DB).
      const stationId = (payload.stationId || "").trim();
      if (!stationId) {
        setError("Invalid QR code: no station ID");
        return;
      }
      if (validStationIds.size > 0 && !validStationIds.has(stationId)) {
        setError("Station not found. Use a QR code from an On-Brella station.");
        return;
      }

      setError(null);
      setStatus("loading");
      try {
        await startRental(stationId);
        navigate("/active", { replace: true });
      } catch (e) {
        setError(e?.message || "Could not start rental");
        setStatus("idle");
      }
    },
    [status, isReturn, activeRental, startRental, endRental, navigate, validStationIds]
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white font-display flex flex-col">
      {/* Full-screen QR scanner with camera - only scans within the square */}
      <QrScanner
        fullScreen
        qrboxSize={{ width: boxSize, height: boxSize }}
        onScan={handleScan}
        onError={(e) => setCameraError(e?.message || "Camera error")}
      />

      {/* Dark overlay with clear viewfinder in the middle (4 panels) */}
      <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden>
        <div
          className="absolute left-0 right-0 top-0 bg-black/55"
          style={{ height: `calc(50vh - ${boxSize / 2}px)` }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 bg-black/55"
          style={{ height: `calc(50vh - ${boxSize / 2}px)` }}
        />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 bg-black/55"
          style={{ width: `calc(50vw - ${boxSize / 2}px)`, height: boxSize }}
        />
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/55"
          style={{ width: `calc(50vw - ${boxSize / 2}px)`, height: boxSize }}
        />
      </div>

      {/* Blue corner viewfinder in the center */}
      <div
        className="absolute left-1/2 top-1/2 z-[2] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ width: boxSize, height: boxSize }}
        aria-hidden
      >
        <div
          className="absolute top-0 left-0 border-primary rounded-tl-2xl"
          style={{
            width: cornerSize,
            height: cornerSize,
            borderWidth: cornerWidth,
            borderBottom: "none",
            borderRight: "none",
          }}
        />
        <div
          className="absolute top-0 right-0 border-primary rounded-tr-2xl"
          style={{
            width: cornerSize,
            height: cornerSize,
            borderWidth: cornerWidth,
            borderBottom: "none",
            borderLeft: "none",
          }}
        />
        <div
          className="absolute bottom-0 left-0 border-primary rounded-bl-2xl"
          style={{
            width: cornerSize,
            height: cornerSize,
            borderWidth: cornerWidth,
            borderTop: "none",
            borderRight: "none",
          }}
        />
        <div
          className="absolute bottom-0 right-0 border-primary rounded-br-2xl"
          style={{
            width: cornerSize,
            height: cornerSize,
            borderWidth: cornerWidth,
            borderTop: "none",
            borderLeft: "none",
          }}
        />
      </div>

      {/* Header (no navigation handler) */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between py-4 px-4 safe-area-inset">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20"
        >
          <span className="material-symbols-outlined text-2xl text-white">close</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-md">
          {isReturn ? "Scan to Return" : "Scan to Rent"}
        </h1>
        <div className="w-10" />
      </div>

      {/* Loading overlay (prevents double scan) */}
      {status === "loading" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
            <span className="text-white font-semibold">
              {isReturn ? "Returning umbrella…" : "Starting rental…"}
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {shownError && (
        <div className="absolute left-4 right-4 top-20 z-10">
          <p className="text-red-300 text-sm text-center bg-black/60 backdrop-blur px-4 py-2 rounded-xl border border-red-500/50">
            {shownError}
          </p>
        </div>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-4 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
        <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-semibold text-white">Rear camera</span>
        </div>
        <p className="text-[11px] text-white/80 uppercase tracking-[0.2em] font-bold">
          Align QR code within the frame
        </p>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/30 rounded-full z-10 pointer-events-none" />
    </div>
  );
}

export default ScanPage2;
