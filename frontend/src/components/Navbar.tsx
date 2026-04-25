import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";

export default function Navbar() {
  const { user, logoutLocal } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network errors during logout
    }
    logoutLocal();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
      isActive ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-brand-600">Expense Tracker</span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/expenses" className={linkClass}>
              Expenses
            </NavLink>
            <NavLink to="/analytics" className={linkClass}>
              Analytics
            </NavLink>
            {user?.is_admin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Hi, <span className="font-medium text-slate-800">{user?.username}</span>
            {user?.is_admin && <span className="ml-2 badge bg-amber-100 text-amber-700">admin</span>}
          </span>
          <button onClick={handleLogout} className="btn-ghost">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
