"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, ChevronLeft, ChevronRight, Shield, Crown, Ban, CheckCircle, Edit3, X, Save, Copy, Check, UserPlus } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

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

interface EditModal {
  user: UserProfile;
}

const PREADDED_USERS: UserProfile[] = [
  {
    id: "usr-admin-master",
    full_name: "Pratyush Malviya",
    email: "malviya.pratyush26@gmail.com",
    role: "admin",
    plan: "enterprise",
    status: "active",
    ai_calls_used: 142,
    ai_calls_limit: 10000,
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    signup_source: "google_oauth",
    notes: "Super Admin & Creator",
  },
  {
    id: "usr-demo-pro",
    full_name: "Rahul Sharma",
    email: "rahul.sharma@applyx.ai",
    role: "user",
    plan: "pro",
    status: "active",
    ai_calls_used: 38,
    ai_calls_limit: 500,
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    signup_source: "email_signup",
    notes: "Senior Software Engineer Candidate",
  },
];

export default function UsersPage() {
  const { toast } = useToast();
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "admin",
    plan: "pro",
  });
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) {
      toast("Validation Error", "Email and Password are required", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ email: "", password: "", full_name: "", role: "admin", plan: "pro" });
        toast("User Created", `Successfully created ${createForm.role.toUpperCase()} account for ${createForm.email}`, "success");
        loadUsers();
      } else {
        toast("Creation Failed", json.error ?? "Failed to create user", "error");
      }
    } catch {
      toast("Error", "Network request error", "error");
    }
    setCreating(false);
  };

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
      if (res.ok && json.data && json.data.length > 0) {
        setUsers(json.data);
        setTotal(json.total ?? json.data.length);
      } else {
        setUsers(PREADDED_USERS);
        setTotal(PREADDED_USERS.length);
      }
    } catch {
      setUsers(PREADDED_USERS);
      setTotal(PREADDED_USERS.length);
    }
    setLoading(false);
  }, [page, debouncedSearch, plan, role, status]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast("Copied to Clipboard", text, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      const json = await res.json();
      if (res.ok) {
        setEditModal(null);
        toast("User Updated", `Profile settings updated for ${editModal.user.full_name ?? "user"}.`, "success");
        loadUsers();
      } else {
        toast("Update Failed", json.error ?? "Failed to update profile", "error");
      }
    } catch {
      toast("Error", "Network request error", "error");
    }
    setSaving(false);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Admin / SaaS Operations</div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users size={22} className="text-blue-600" /> User Directory</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{total.toLocaleString()} total registered user profiles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
        >
          <UserPlus size={16} /> Create User with Role
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        {[
          { label: "Plan", value: plan, setter: setPlan, options: ["all","free","pro","enterprise"] },
          { label: "Role", value: role, setter: setRole, options: ["all","user","admin","moderator"] },
          { label: "Status", value: status, setter: setStatus, options: ["all","active","suspended","banned"] },
        ].map(({ label, value, setter, options }) => (
          <select key={label} value={value} onChange={(e) => { setter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500">
            {options.map(o => <option key={o} value={o}>{o === "all" ? `All ${label}s` : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400">
                <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">AI Calls Limit</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4"><div className="h-5 bg-slate-800 rounded-xl animate-pulse w-3/4" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-500"><Users size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-medium">No users matched your filter criteria.</p></td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs sm:text-sm">{u.full_name ?? "—"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <span>{u.email ?? u.id}</span>
                        <button onClick={() => copyText(u.email ?? u.id, u.id)} className="text-slate-500 hover:text-white" title="Copy Email">
                          {copiedId === u.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${u.role === "admin" ? "bg-violet-500/10 text-violet-300 border-violet-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                        {u.role === "admin" && <Shield size={11} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}>
                        {u.plan === "pro" && <Crown size={11} />}
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[u.status] ?? STATUS_COLORS.active}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-2 min-w-20 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (u.ai_calls_used / Math.max(1, u.ai_calls_limit)) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-slate-400">{u.ai_calls_used}/{u.ai_calls_limit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => openEdit(u)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer" title="Edit Profile">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 bg-slate-950/40">
            <div className="text-xs text-slate-400">Page {page} of {totalPages} · {total} users</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-30 cursor-pointer">
                <ChevronLeft size={14} className="text-slate-300" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-30 cursor-pointer">
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-[#090c14] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit User Profile</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-500 hover:text-white p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-sm text-white font-bold">{editModal.user.full_name ?? "No Name Provided"}</p>
              <p className="text-xs text-slate-400 font-mono">{editModal.user.email ?? editModal.user.id}</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Role Permission", key: "role", options: ["user","admin","moderator"] },
                { label: "Subscription Plan", key: "plan", options: ["free","pro","enterprise"] },
                { label: "Account Status", key: "status", options: ["active","suspended","banned"] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">{label}</label>
                  <select value={(editForm as Record<string, string>)[key] ?? ""}
                    onChange={(e) => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">AI Calls Limit</label>
                <input type="number" value={editForm.ai_calls_limit ?? 50}
                  onChange={(e) => setEditForm(f => ({ ...f, ai_calls_limit: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Admin Notes</label>
                <textarea value={editForm.notes ?? ""} rows={2}
                  onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Internal administrative notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer">
                <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateUser} className="bg-[#090c14] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-violet-400" /> Create New User
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. System Admin"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">User Email *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@applyx.ai"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Assigned Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold text-violet-400"
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => setCreateForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="pro font-bold text-amber-400">Pro</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus size={14} /> {creating ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
