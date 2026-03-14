// import { useCallback, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useRental } from "../context/RentalContext";
// import { QrScanner } from "../components/QrScanner";

// /**
//  * Scan page: rent (scan at station) or return (scan at return station).
//  * Full-screen live camera with blue viewfinder box in the center.
//  */
// export function ScanPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { startRental, endRental, activeRental } = useRental();
//   const isReturn = location.pathname === "/scan/return";
//   const [status, setStatus] = useState("idle");
//   const [error, setError] = useState(null);

//   const parseQrPayload = useCallback((text) => {
//     try {
//       const trimmed = (text || "").trim();
//       if (trimmed.startsWith("{")) {
//         const obj = JSON.parse(trimmed);
//         return {
//           stationId: obj.stationId || obj.station_id,
//           slotNumber:
//             typeof obj.slotNumber !== "undefined"
//               ? Number(obj.slotNumber)
//               : Number(obj.slot_number) || 0,
//         };
//       }
//       const parts = trimmed.split(/[:\-]/);
//       if (parts.length >= 2) {
//         return {
//           stationId: parts[0].trim(),
//           slotNumber: parseInt(parts[1], 10) || 0,
//         };
//       }
//       return { stationId: trimmed, slotNumber: 0 };
//     } catch {
//       return null;
//     }
//   }, []);

//   const handleScan = useCallback(
//     async (decodedText) => {
//       if (status === "loading") return;
//       const payload = parseQrPayload(decodedText);
//       // If returning rental, accept ANY recognized QR code and go to thank-you.
//       if (isReturn) {
//         if (!activeRental) {
//           setError("No active rental to return");
//           setStatus("idle");
//           return;
//         }
//         setError(null);
//         setStatus("loading");
//         try {
//           if (payload?.stationId) {
//             await endRental(payload.stationId, payload.slotNumber);
//           } else {
//             // Fallback: attempt to end rental at the original pickup station
//             await endRental(activeRental.stationId, 0);
//           }
//           // Successful end: navigate to thank-you which will show fees and duration
//           navigate("/thank-you", { replace: true });
//         } catch (e) {
//           setError(e.message || "Failed to end rental");
//           setStatus("idle");
//         }
//         return;
//       }

//       // Normal rent flow: require a valid payload
//       if (!payload?.stationId) {
//         setError("Invalid QR code");
//         return;
//       }
//       setError(null);
//       setStatus("loading");
//       try {
//         await startRental(payload.stationId, payload.slotNumber);
//         navigate("/active", { replace: true });
//       } catch (e) {
//         setError(e.message || "Something went wrong");
//         setStatus("idle");
//       }
//     },
//     [
//       status,
//       isReturn,
//       activeRental,
//       startRental,
//       endRental,
//       navigate,
//       parseQrPayload,
//     ],
//   );

//   const handleClose = () => navigate(-1);

//   const boxSize = 260;
//   const cornerSize = 48;
//   const cornerWidth = 4;

//   return (
//     <div className="fixed inset-0 overflow-hidden bg-black text-white font-display flex flex-col">
//       {/* Full-screen live camera background */}
//       <QrScanner
//         fullScreen
//         onScan={handleScan}
//         onError={(e) => setError(e?.message || "Camera error")}
//       />

//       {/* Dark overlay with clear viewfinder in the middle (4 panels) */}
//       <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden>
//         <div
//           className="absolute left-0 right-0 top-0 bg-black/55"
//           style={{ height: `calc(50vh - ${boxSize / 2}px)` }}
//         />
//         <div
//           className="absolute left-0 right-0 bottom-0 bg-black/55"
//           style={{ height: `calc(50vh - ${boxSize / 2}px)` }}
//         />
//         <div
//           className="absolute top-1/2 left-0 -translate-y-1/2 bg-black/55"
//           style={{ width: `calc(50vw - ${boxSize / 2}px)`, height: boxSize }}
//         />
//         <div
//           className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/55"
//           style={{ width: `calc(50vw - ${boxSize / 2}px)`, height: boxSize }}
//         />
//       </div>

//       {/* Blue corner viewfinder in the center */}
//       <div
//         className="absolute left-1/2 top-1/2 z-[2] pointer-events-none -translate-x-1/2 -translate-y-1/2"
//         style={{ width: boxSize, height: boxSize }}
//         aria-hidden
//       >
//         <div
//           className="absolute top-0 left-0 border-primary rounded-tl-2xl"
//           style={{
//             width: cornerSize,
//             height: cornerSize,
//             borderWidth: cornerWidth,
//             borderBottom: "none",
//             borderRight: "none",
//           }}
//         />
//         <div
//           className="absolute top-0 right-0 border-primary rounded-tr-2xl"
//           style={{
//             width: cornerSize,
//             height: cornerSize,
//             borderWidth: cornerWidth,
//             borderBottom: "none",
//             borderLeft: "none",
//           }}
//         />
//         <div
//           className="absolute bottom-0 left-0 border-primary rounded-bl-2xl"
//           style={{
//             width: cornerSize,
//             height: cornerSize,
//             borderWidth: cornerWidth,
//             borderTop: "none",
//             borderRight: "none",
//           }}
//         />
//         <div
//           className="absolute bottom-0 right-0 border-primary rounded-br-2xl"
//           style={{
//             width: cornerSize,
//             height: cornerSize,
//             borderWidth: cornerWidth,
//             borderTop: "none",
//             borderLeft: "none",
//           }}
//         />
//       </div>

//       {/* Header */}
//       <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between py-4 px-4 safe-area-inset">
//         <button
//           type="button"
//           onClick={handleClose}
//           className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20"
//         >
//           <span className="material-symbols-outlined text-2xl text-white">
//             close
//           </span>
//         </button>
//         <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-md">
//           {isReturn ? "Scan to Return" : "Scan to Rent"}
//         </h1>
//         <div className="w-10" />
//       </div>

//       {/* Error message */}
//       {error && (
//         <div className="absolute left-4 right-4 top-20 z-10">
//           <p className="text-red-300 text-sm text-center bg-black/60 backdrop-blur px-4 py-2 rounded-xl border border-red-500/50">
//             {error}
//           </p>
//         </div>
//       )}

//       {/* Bottom hint */}
//       <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-4 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
//         <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-2">
//           <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
//           <span className="text-sm font-semibold text-white"></span>
//         </div>
//         <p className="text-[11px] text-white/80 uppercase tracking-[0.2em] font-bold">
//           Align QR code within the frame
//         </p>
//       </div>

//       <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/30 rounded-full z-10 pointer-events-none" />
//     </div>
//   );
// }
