import { useEffect, useState, useMemo } from "react";
import { adminGetUsers } from "../../api/adminClient";

const FILTER_ALL = "all";
const FILTER_ADMINS = "admins";

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(FILTER_ALL);

  useEffect(() => {
    let cancelled = false;
    adminGetUsers()
      .then((res) => {
        if (!cancelled) setUsers(res.users || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (filter === FILTER_ADMINS) {
      list = list.filter((u) => u.role === "admin");
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-300">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <button
          type="button"
          onClick={() => setFilter(FILTER_ALL)}
          className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === FILTER_ALL
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter(FILTER_ADMINS)}
          className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === FILTER_ADMINS
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          Admins ({users.filter((u) => u.role === "admin").length})
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  User Details
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Role
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm"
                  >
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {u.full_name || "—"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {u.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          u.role === "admin"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          —
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {users.length} users
          </span>
        </div>
      </div>
    </div>
  );
}
