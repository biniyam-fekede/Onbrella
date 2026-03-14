import { useNavigate } from "react-router-dom";

/**
 * Generic "Coming soon" placeholder for profile sub-pages (payment methods, notifications, etc.).
 */
export function ComingSoonPage({ title = "Coming soon" }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 sm:pt-6 pb-28">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-medium text-sm mb-6 transition-colors"
        >
          <span className="material-icons text-lg">arrow_back</span>
          Back to account
        </button>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-icons text-3xl text-slate-400">construction</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center max-w-xs">
            This section is not available yet. Check back later.
          </p>
        </div>
      </main>
    </div>
  );
}
