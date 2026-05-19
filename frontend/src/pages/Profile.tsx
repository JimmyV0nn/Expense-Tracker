import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";

type EditSection = "username" | "email" | "password" | null;

export default function Profile() {
  const { user, setAuth, token } = useAuthStore();

  const [editing, setEditing] = useState<EditSection>(null);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function openEdit(section: EditSection) {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setConfirmPassword("");
    setEditing(section);
  }

  function cancelEdit() {
    setEditing(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function saveSection(section: EditSection) {
    const payload: Record<string, string> = {};

    if (section === "username") {
      if (username === user?.username) { toast.error("No changes to save"); return; }
      payload.username = username;
    } else if (section === "email") {
      if (email === user?.email) { toast.error("No changes to save"); return; }
      payload.email = email;
    } else if (section === "password") {
      if (!password) { toast.error("Enter a new password"); return; }
      if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
      payload.password = password;
    }

    setLoading(true);
    try {
      const { data } = await api.patch("/auth/me", payload);
      setAuth(token!, data);
      toast.success("Profile updated");
      setEditing(null);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const avatarLetter = (user?.username ?? "?")[0].toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header card with avatar */}
      <div className="card flex items-center gap-5">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold select-none">
          {avatarLetter}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-800 truncate">
              {user?.username}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user?.is_admin
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {user?.is_admin ? "Admin" : "User"}
            </span>
          </div>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">Member since {joinedDate}</p>
        </div>
      </div>

      {/* Account info card */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Account Information</h2>
        <div className="divide-y divide-slate-100">
          <InfoRow label="Username" value={user?.username ?? "—"} />
          <InfoRow label="Email" value={user?.email ?? "—"} />
          <InfoRow
            label="Role"
            value={user?.is_admin ? "Administrator" : "Standard User"}
          />
          <InfoRow label="Member since" value={joinedDate} />
          <InfoRow
            label="Account status"
            value={user?.is_active ? "Active" : "Inactive"}
          />
        </div>
      </div>

      {/* Edit sections */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Edit Profile</h2>

        <EditCard
          title="Username"
          current={user?.username}
          isEditing={editing === "username"}
          loading={loading}
          onEdit={() => openEdit("username")}
          onCancel={cancelEdit}
          onSave={() => saveSection("username")}
        >
          <div>
            <label className="label">New username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
        </EditCard>

        <EditCard
          title="Email"
          current={user?.email}
          isEditing={editing === "email"}
          loading={loading}
          onEdit={() => openEdit("email")}
          onCancel={cancelEdit}
          onSave={() => saveSection("email")}
        >
          <div>
            <label className="label">New email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
        </EditCard>

        <EditCard
          title="Password"
          current="••••••••"
          isEditing={editing === "password"}
          loading={loading}
          onEdit={() => openEdit("password")}
          onCancel={cancelEdit}
          onSave={() => saveSection("password")}
        >
          <div className="space-y-3">
            <div>
              <label className="label">New password</label>
              <input
                className="input"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                className="input"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </EditCard>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

function EditCard({
  title,
  current,
  isEditing,
  loading,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string;
  current?: string;
  isEditing: boolean;
  loading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          {!isEditing && (
            <p className="text-sm text-slate-800 mt-0.5 truncate">{current}</p>
          )}
        </div>
        {!isEditing && (
          <button className="btn-ghost text-xs ml-4 flex-shrink-0" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 space-y-4">
          {children}
          <div className="flex gap-2 pt-1">
            <button
              className="btn-primary disabled:opacity-50"
              onClick={onSave}
              disabled={loading}
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button className="btn-ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
