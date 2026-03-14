/**
 * Account / Profile page — hub for user info and settings.
 *
 * Uses UserContext (Supabase auth + profiles).
 * Menu: Back to map (top), Personal Information, Payment Methods, Notifications, Help, Rental history, Log out.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuth } from "../hooks/useAuth";

export function ProfilePage() {
  const { user, loading, error, refreshUser } = useUser();
  const { logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  const handlePersonalInfo = () => navigate("/profile/personal-info");
  const handleNotifications = () => navigate("/profile/notifications");
  const handleHelpSupport = () => navigate("/profile/help");

  const handleAdmin = () => navigate("/admin");

  const menuItems = [
    { label: "Personal Information", icon: "person", iconBg: "bg-blue-50 dark:bg-blue-900/20 text-blue-500", onClick: handlePersonalInfo },
    { label: "Notifications", icon: "notifications", iconBg: "bg-amber-50 dark:bg-amber-900/20 text-amber-500", onClick: handleNotifications },
    { label: "Help & Support", icon: "help", iconBg: "bg-purple-50 dark:bg-purple-900/20 text-purple-500", onClick: handleHelpSupport },
  ];

  if (user?.role === "admin") {
    menuItems.unshift({
      label: "Admin",
      icon: "admin_panel_settings",
      iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
      onClick: handleAdmin,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        <main className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-28 sm:pb-32 md:pb-36 overflow-y-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="h-6 w-40 mt-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-56 mt-2 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <main className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-28 sm:pb-32 md:pb-36 overflow-y-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-medium text-sm mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to map
        </Link>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between gap-2">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button type="button" onClick={refreshUser} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0">
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-center break-words max-w-full px-2">
            {user?.name ? `Hey, ${user.name}` : "Hey there"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base text-center break-all max-w-full px-2 mt-0.5">
            {user?.email || "No email set"}
          </p>
          {user?.location && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 max-w-full">
              <span className="material-symbols-outlined text-base shrink-0">location_on</span>
              <span className="truncate">{user.location}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center justify-between p-3 sm:p-4 md:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${
                  index < menuItems.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 ${item.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-lg sm:text-xl">{item.icon}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white text-left truncate text-sm sm:text-base">{item.label}</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 flex-shrink-0 ml-2">chevron_right</span>
              </button>
            ))}
            <Link
              to="/history"
              className="w-full flex items-center justify-between p-3 sm:p-4 md:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg sm:text-xl">history</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-left truncate text-sm sm:text-base">
                  Rental history
                </span>
              </div>
              <span className="material-symbols-outlined text-slate-400 flex-shrink-0 ml-2">chevron_right</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-red-500 font-bold shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-[0.98] transition-all text-sm sm:text-base disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
            {isLoggingOut ? "Logging out…" : "Log Out"}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600 pt-2 sm:pt-4 font-medium">On-Brella - We've got you covered!</p>
        </div>
      </main>
    </div>
  );
}
