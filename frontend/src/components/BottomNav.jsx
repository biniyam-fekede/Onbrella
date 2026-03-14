import { NavLink, useLocation } from "react-router-dom";
import { useRental } from "../context/RentalContext";

/**
 * Bottom nav: Map, Active, Account. History is part of the Account page.
 */
export function BottomNav() {
  const location = useLocation();
  const { activeRental } = useRental();
  const isMap = location.pathname === "/";
  const isActive = location.pathname === "/active";
  const isProfile = location.pathname === "/profile";

  const linkClass = (active) =>
    `flex flex-col items-center gap-1 transition-colors min-w-[56px] ${
      active ? "text-primary" : "text-slate-400 dark:text-slate-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-4 sm:px-6 pt-3 pb-safe flex justify-between items-center z-30">
      <NavLink to="/" className={linkClass(isMap)}>
        <span className="material-icons text-xl sm:text-2xl">explore</span>
        <span className="text-[10px] sm:text-xs font-bold">Map</span>
      </NavLink>
      <NavLink to="/active" className={`${linkClass(isActive)} relative`}>
        <span className="material-icons text-xl sm:text-2xl">umbrella</span>
        <span className="text-[10px] sm:text-xs font-bold">Active</span>
        {activeRental && (
          <span className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </NavLink>
      <NavLink to="/profile" className={linkClass(isProfile)}>
        <span className="material-icons text-xl sm:text-2xl">person_outline</span>
        <span className="text-[10px] sm:text-xs font-bold">Account</span>
      </NavLink>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
    </nav>
  );
}
