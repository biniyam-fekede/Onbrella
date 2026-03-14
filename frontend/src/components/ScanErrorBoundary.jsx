import { Component } from "react";
import { useNavigate } from "react-router-dom";

function FallbackWithNav() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white font-display flex flex-col items-center justify-center px-6">
      <p className="text-white/90 font-medium mb-2">Something went wrong</p>
      <p className="text-white/60 text-sm text-center mb-6">
        The scanner couldn’t start. Try again or use the map to find a station.
      </p>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="px-6 py-3 rounded-xl bg-white text-black font-bold"
      >
        Close
      </button>
    </div>
  );
}

export class ScanErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ScanErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white font-display flex flex-col items-center justify-center px-6">
          <p className="text-white/90 font-medium mb-2">Something went wrong</p>
          <p className="text-white/60 text-sm text-center mb-6">
            {this.state.error?.message || "The scanner couldn't start. Try again or use the map to find a station."}
          </p>
          <details className="text-white/40 text-xs mb-6 max-w-md">
            <summary className="cursor-pointer mb-2">Technical details</summary>
            <pre className="bg-white/5 p-2 rounded text-left overflow-auto max-h-32">
              {this.state.error?.stack || "No stack trace"}
            </pre>
          </details>
          <button
            type="button"
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 rounded-xl bg-white text-black font-bold"
          >
            Back to Map
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
