import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * QR scanner wrapper. Uses html5-qrcode; loads dynamically so a failure doesn't crash the page.
 * fullScreen: camera fills viewport as background; otherwise constrained box.
 * qrboxSize: optional size for qrbox when fullScreen is true (e.g., {width: 260, height: 260}).
 */
export function QrScanner({ onScan, onError, fullScreen = false, qrboxSize = null }) {
  const containerRef = useRef(null);
  const elementId = "qr-reader-" + useId().replace(/:/g, "");
  const [loadError, setLoadError] = useState(null);
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef(null);
  const scannerRunningRef = useRef(false);

  const handleSuccess = useCallback(
    (decodedText) => {
      onScan?.(decodedText);
    },
    [onScan]
  );

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) {
      setLoadError("Container not ready");
      return;
    }

    async function init() {
      try {
        let Html5Qrcode;
        try {
          const module = await import("html5-qrcode");
          Html5Qrcode = module.Html5Qrcode;
        } catch (importErr) {
          throw new Error(`Failed to load QR scanner library: ${importErr.message}`);
        }

        if (cancelled) return;

        if (!Html5Qrcode) {
          throw new Error("Html5Qrcode not available after import");
        }

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;
        if (cancelled) return;

        // Calculate qrbox: use custom size if provided, otherwise default behavior
        let qrboxConfig;
        if (fullScreen && qrboxSize) {
          // Use a function to calculate qrbox based on video dimensions
          // The qrbox will be centered automatically by html5-qrcode
          qrboxConfig = (viewfinderWidth, viewfinderHeight) => {
            // Calculate the size as a percentage of viewport, then apply to video
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const widthPercent = (qrboxSize.width / viewportWidth) * 100;
            const heightPercent = (qrboxSize.height / viewportHeight) * 100;
            // Use the average to maintain square aspect ratio
            const avgPercent = (widthPercent + heightPercent) / 2;
            const width = Math.floor((viewfinderWidth * avgPercent) / 100);
            const height = Math.floor((viewfinderHeight * avgPercent) / 100);
            return { width, height };
          };
        } else if (fullScreen) {
          qrboxConfig = undefined;
        } else {
          qrboxConfig = { width: 250, height: 250 };
        }

        await scanner.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: qrboxConfig },
          (text) => handleSuccess(text),
          () => {}
        );
        if (cancelled) {
          try {
            await scanner.stop().catch(() => {});
          } catch {
            // ignore: scanner may not be in runnable state
          }
        } else {
          scannerRunningRef.current = true;
          setStarting(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err?.message || "Camera unavailable";
          setLoadError(message);
          onError?.(err);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      const wasRunning = scannerRunningRef.current;
      scannerRef.current = null;
      scannerRunningRef.current = false;
      if (scanner && typeof scanner.stop === "function" && wasRunning) {
        try {
          scanner.stop().catch(() => {});
        } catch {
          // "Cannot stop, scanner is not running or paused" when unmount before start() finished
        }
      }
    };
  }, [elementId, fullScreen, qrboxSize, handleSuccess, onError]);

  if (loadError) {
    return (
      <div className="w-full max-w-[280px] rounded-2xl bg-black/40 border border-white/20 p-6 text-center">
        <p className="text-white/90 text-sm font-medium">Camera unavailable</p>
        <p className="text-white/60 text-xs mt-1">{loadError}</p>
      </div>
    );
  }

  const wrapperClass = fullScreen
    ? "qr-scanner-fullscreen fixed inset-0 z-0 w-full h-full overflow-hidden"
    : "relative w-full max-w-[280px] overflow-hidden rounded-2xl bg-black";
  const innerClass = fullScreen
    ? "absolute inset-0 w-full h-full [&_video]:!absolute [&_video]:!inset-0 [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_*]:!max-w-none [&_*]:!max-h-none"
    : "w-full h-full [&_video]:!rounded-2xl [&_video]:!object-cover";

  return (
    <div className={wrapperClass} style={fullScreen ? undefined : { minHeight: 250 }}>
      <div
        id={elementId}
        ref={containerRef}
        className={innerClass}
      />
      {starting && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/80 ${fullScreen ? "" : "rounded-2xl"}`}
        >
          <span className="text-white/90 text-sm">Starting camera…</span>
        </div>
      )}
    </div>
  );
}
