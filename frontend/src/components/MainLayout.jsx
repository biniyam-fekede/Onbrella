import { Outlet } from "react-router-dom";

export function MainLayout({ children }) {
  return (
    <div className="min-h-screen min-h-dvh bg-background-dark font-display text-slate-900 dark:text-slate-100 flex flex-col">
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
