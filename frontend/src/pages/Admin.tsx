import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import type { Activity, ActivityQuery, User, UserUpdateRequest } from "../types";

// ─── tiny helpers ──────────────────────────────────────────────────────────

function fmt(iso: string) {
  // toLocaleString gives us a readable local time without pulling in a date library.
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ─── skeleton row ──────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── confirm-delete dialog ─────────────────────────────────────────────────

interface ConfirmDialogProps {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ username, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    // Clicking the dark backdrop also cancels — saves the user a click if
    // they accidentally opened the dialog.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800">Delete user?</h2>
        <p className="text-sm text-slate-600">
          <span className="font-medium">{username}</span> will be permanently
          removed. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── tab: user management ──────────────────────────────────────────────────

function UsersTab() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks which user row is mid-request so we can disable its buttons.
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  // When non-null, the confirm dialog is open for this user.
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<User[]>("/users/");
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function patch(userId: number, update: UserUpdateRequest, successMsg: string) {
    setMutatingId(userId);
    try {
      await api.patch(`/users/${userId}`, update);
      toast.success(successMsg);
      // Re-fetch the full list so every column reflects the latest DB state.
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Action failed");
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDelete(user: User) {
    setMutatingId(user.id);
    setPendingDelete(null);
    try {
      await api.delete(`/users/${user.id}`);
      toast.success(`${user.username} deleted`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Delete failed");
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <>
      {pendingDelete && (
        <ConfirmDialog
          username={pendingDelete.username}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="mb-4 flex justify-end">
        {/* Manual refresh for cases where users were added outside this page
            (e.g. via the register endpoint) — the list only auto-updates
            after actions taken within the tab itself. */}
        <button
          className="btn-ghost"
          onClick={fetchUsers}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={6} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const busy = mutatingId === u.id;
                return (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>

                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        // Black badge makes admin accounts visually distinct at a glance.
                        <span className="badge bg-slate-900 text-white">Admin</span>
                      ) : (
                        <span className="badge">User</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                      ) : (
                        <span className="badge bg-rose-100 text-rose-700">Inactive</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500">{fmt(u.created_at)}</td>

                    <td className="px-4 py-3">
                      {/* Hide all action buttons on the admin's own row.
                          The backend enforces this too, but hiding them here
                          prevents confusing UX where buttons exist but always error. */}
                      {isSelf ? (
                        <span className="text-xs text-slate-400 italic">you</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            disabled={busy}
                            className="btn-ghost py-1 px-2 text-xs disabled:opacity-50"
                            onClick={() =>
                              patch(
                                u.id,
                                { is_admin: !u.is_admin },
                                u.is_admin
                                  ? `${u.username} is no longer admin`
                                  : `${u.username} is now admin`
                              )
                            }
                          >
                            {u.is_admin ? "Remove admin" : "Make admin"}
                          </button>

                          <button
                            disabled={busy}
                            className="btn-ghost py-1 px-2 text-xs disabled:opacity-50"
                            onClick={() =>
                              patch(
                                u.id,
                                { is_active: !u.is_active },
                                u.is_active
                                  ? `${u.username} deactivated`
                                  : `${u.username} activated`
                              )
                            }
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            disabled={busy}
                            className="btn-danger py-1 px-2 text-xs disabled:opacity-50"
                            onClick={() => setPendingDelete(u)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── tab: activity log ─────────────────────────────────────────────────────

// Badge colours for the three action types.
const ACTION_BADGE: Record<string, string> = {
  register: "bg-blue-100 text-blue-700",
  login: "bg-slate-100 text-slate-700",
  logout: "ring-1 ring-slate-300 text-slate-600",
};

function ActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // emailInput is what's typed in the box; appliedEmail is what we last fetched with.
  // Keeping them separate means the filter only fires when the user explicitly hits
  // Filter/Enter, not on every keystroke.
  const [emailInput, setEmailInput] = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  const fetchActivities = useCallback(
    async (query: ActivityQuery = {}) => {
      setLoading(true);
      setError(null);
      try {
        // axios serialises the params object into a query string automatically,
        // and skips keys whose value is undefined/empty string.
        const params: Record<string, string | number> = {};
        if (query.user_email) params.user_email = query.user_email;
        if (query.action) params.action = query.action;
        if (query.skip !== undefined) params.skip = query.skip;
        if (query.limit !== undefined) params.limit = query.limit;

        const { data } = await api.get<Activity[]>("/activities/", { params });
        setActivities(data);
      } catch (err: any) {
        setError(err.response?.data?.detail ?? "Failed to load activities");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load with no filters on first render.
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function applyFilter() {
    setAppliedEmail(emailInput);
    fetchActivities({
      user_email: emailInput || undefined,
      action: actionFilter || undefined,
    });
  }

  function clearFilter() {
    setEmailInput("");
    setAppliedEmail("");
    setActionFilter("");
    fetchActivities();
    emailRef.current?.focus();
  }

  const hasActiveFilter = appliedEmail !== "" || actionFilter !== "";

  return (
    <div className="space-y-4">
      {/* ── filter bar ── */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="label">User email</label>
          <input
            ref={emailRef}
            className="input"
            placeholder="alice@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            // Pressing Enter is a natural shortcut — users expect this to submit.
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
          />
        </div>

        <div>
          <label className="label">Action</label>
          <select
            className="input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="register">register</option>
            <option value="login">login</option>
            <option value="logout">logout</option>
          </select>
        </div>

        <button className="btn-primary" onClick={applyFilter}>
          Filter
        </button>

        {/* Only show Clear when a filter is actually active so the bar
            isn't cluttered when there's nothing to clear. */}
        {hasActiveFilter && (
          <button className="btn-ghost" onClick={clearFilter}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {/* ── activity table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">User email</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">IP address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={4} />
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No activity found
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{a.user_email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ACTION_BADGE[a.action] ?? "badge"}`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmt(a.timestamp)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {a.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── page root ─────────────────────────────────────────────────────────────

type Tab = "users" | "activities";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("users");

  const tabClass = (t: Tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition ${
      tab === t
        ? "border-brand-500 text-brand-600"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Admin</h1>

      <div className="card p-0 overflow-hidden">
        {/* Tab strip */}
        <div className="flex border-b border-slate-200 px-2">
          <button className={tabClass("users")} onClick={() => setTab("users")}>
            User Management
          </button>
          <button className={tabClass("activities")} onClick={() => setTab("activities")}>
            Activity Log
          </button>
        </div>

        {/* Tab content — both tabs stay mounted so switching back doesn't
            re-fetch unless an action was taken. */}
        <div className={`p-5 ${tab === "users" ? "" : "hidden"}`}>
          <UsersTab />
        </div>
        <div className={`p-5 ${tab === "activities" ? "" : "hidden"}`}>
          <ActivitiesTab />
        </div>
      </div>
    </div>
  );
}
