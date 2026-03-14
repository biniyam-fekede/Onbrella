import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultHomeAnnouncementsDocument } from "../content/contentRegistry";
import { useHomeAnnouncement } from "../hooks/useHomeAnnouncement";
import {
  dismissAnnouncementForSession,
  getAnnouncementSessionState,
} from "../utils/announcementSession";

export function NotificationsPage() {
  const navigate = useNavigate();
  const announcement = useHomeAnnouncement();
  const [showAnnouncement, setShowAnnouncement] = useState(
    Boolean(defaultHomeAnnouncementsDocument.enabled)
  );

  useEffect(() => {
    if (!announcement.enabled || (!announcement.title && !announcement.message)) {
      setShowAnnouncement(false);
      return;
    }
    const { dismissed } = getAnnouncementSessionState(announcement);
    setShowAnnouncement(!dismissed);
  }, [announcement]);

  const handleDismiss = () => {
    dismissAnnouncementForSession(announcement);
    setShowAnnouncement(false);
  };

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

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Important service updates from On-Brella.
          </p>
        </div>

        {announcement.enabled && showAnnouncement ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">notifications</span>
              </div>
              <div className="min-w-0 flex-1">
                {announcement.badge && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {announcement.badge}
                  </p>
                )}
                {announcement.title && (
                  <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {announcement.title}
                  </h2>
                )}
                {announcement.message && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {announcement.message}
                  </p>
                )}
                {announcement.ctaLabel && announcement.ctaPath && (
                  <button
                    type="button"
                    onClick={() => navigate(announcement.ctaPath)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    {announcement.ctaLabel}
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Dismiss notification"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400">notifications_off</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              No new notifications
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Service announcements will appear here when they are published.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
