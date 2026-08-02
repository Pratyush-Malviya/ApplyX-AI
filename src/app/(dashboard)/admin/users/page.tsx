"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, ChevronLeft, ChevronRight, Shield, Crown, Ban, CheckCircle, Edit3, X, Save } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  plan: string;
  status: string;
  ai_calls_used: number;
  ai_calls_limit: number;
  created_at: string;
  last_seen_at: string | null;
  signup_source: string | null;
  notes: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-700/50 text-slate-300 border-slate-600",
  pro: "bg-violet-600/20 text-violet-300 border-violet-500/40",
  enterprise: "bg-amber-600/20 text-amber-300 border-amber-500/40",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
  suspended: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  banned: "bg-rose-600/20 text-rose-400 border-rose-500/40",
};
const ROLE_ICONS: Record<string, React.ElementType> = { admin: Shield, user: Users };

interface EditModal {
  user: UserProfile;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search: debouncedSearch, plan, role, status });
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (res.ok) { setUsers(json.data ?? []); setTotal(json.total ?? 0); }
    } catch {}
    setLoading(false);
  }, [page, debouncedSearch, plan, role, status]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openEdit = (user: UserProfile) => {
    setEditModal({ user });
    setEditForm({ role: user.role, plan: user.plan, status: user.status, notes: user.notes ?? "", ai_calls_limit: user.ai_calls_limit });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editModal.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setEditModal(null); loadUsers(); }
    } catch {}
    setSaving(false);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={22} className="text-blue-400" /> User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        {[
          { label: "Plan", value: plan, setter: setPlan, options: ["all","free","pro","enterprise"] },
          { label: "Role", value: role, setter: setRole, options: ["all","user","admin","moderator"] },
          { label: "Status", value: status, setter: setStatus, options: ["all","active","suspended","banned"] },
        ].map(({ label, value, setter, options }) => (
          <select key={label} value={value} onChange={(e) => { setter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
            {options.map(o => <option key={o} value={o}>{o === "all" ? `All ${label}s` : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Usage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/40">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white text-sm">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{u.email ?? u.id.slice(0, 12) + "..."}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${u.role === "admin" ? "bg-violet-600/20 text-violet-300 border-violet-500/40" : "bg-slate-700/50 text-slate-400 border-slate-600/50"}`}>
                        {u.role === "admin" && <Shield size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}>
                        {u.plan === "pro" && <Crown size={10} />}
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[u.status] ?? STATUS_COLORS.active}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 min-w-16">
                          <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${Math.min(100, (u.ai_calls_used / Math.max(1, u.ai_calls_limit)) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{u.ai_calls_used}/{u.ai_calls_limit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-slate-300">
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
            <div className="text-xs text-slate-500">Page {page} of {totalPages} · {total} users</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={14} className="text-slate-400" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Edit User</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <div className="space-y-1 mb-5">
              <p className="text-sm text-white font-medium">{editModal.user.full_name ?? "Unknown"}</p>
              <p className="text-xs text-slate-500">{editModal.user.email ?? editModal.user.id}</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Role", key: "role", options: ["user","admin","moderator"] },
                { label: "Plan", key: "plan", options: ["free","pro","enterprise"] },
                { label: "Status", key: "status", options: ["active","suspended","banned"] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
                  <select value={(editForm as Record<string, string>)[key] ?? ""}
                    onChange={(e) => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">AI Calls Limit</label>
                <input type="number" value={editForm.ai_calls_limit ?? 50}
                  onChange={(e) => setEditForm(f => ({ ...f, ai_calls_limit: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Admin Notes</label>
                <textarea value={editForm.notes ?? ""} rows={2}
                  onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
