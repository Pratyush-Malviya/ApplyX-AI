"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, ChevronLeft, ChevronRight, Plus, X, Save, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  provider: string;
  amount_inr: number | null;
  billing_cycle: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null };
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  plan: string | null;
  description: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
  cancelled: "bg-slate-700/50 text-slate-400 border-slate-600",
  past_due: "bg-rose-600/20 text-rose-400 border-rose-500/40",
  trialing: "bg-cyan-600/20 text-cyan-400 border-cyan-500/40",
  success: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
  pending: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  failed: "bg-rose-600/20 text-rose-400 border-rose-500/40",
  refunded: "bg-blue-600/20 text-blue-400 border-blue-500/40",
};

export default function PaymentsPage() {
  const [tab, setTab] = useState<"subscriptions" | "transactions">("subscriptions");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ user_id: "", plan: "pro", billing_cycle: "monthly", amount_inr: "", provider: "manual", status: "active" });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", status });
      if (tab === "subscriptions") {
        const res = await fetch(`/api/admin/subscriptions?${params}`);
        const json = await res.json();
        if (res.ok) { setSubs(json.data ?? []); setTotal(json.total ?? 0); }
      } else {
        const res = await fetch(`/api/admin/payments?${params}`);
        const json = await res.json();
        if (res.ok) { setTxs(json.data ?? []); setTotal(json.total ?? 0); }
      }
    } catch {}
    setLoading(false);
  }, [tab, page, status]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const body = tab === "subscriptions"
        ? { ...createForm, amount_inr: createForm.amount_inr ? Number(createForm.amount_inr) : null }
        : { user_id: createForm.user_id, amount: Number(createForm.amount_inr), currency: "INR", status: "success", provider: createForm.provider, plan: createForm.plan, description: "Manual grant" };
      const res = await fetch(`/api/admin/${tab === "subscriptions" ? "subscriptions" : "payments"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) { setShowCreate(false); loadData(); }
    } catch {}
    setCreating(false);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard size={22} className="text-amber-400" /> Payment Management</h1>
          <p className="text-slate-500 text-sm mt-1">Subscriptions, transactions, and revenue overview</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors">
          <Plus size={15} /> Add Manual Record
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["subscriptions", "transactions"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-violet-600/20 text-violet-300 border border-violet-500/40" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="ml-auto">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="all">All Status</option>
            {tab === "subscriptions"
              ? ["active","cancelled","past_due","trialing","paused"].map(s => <option key={s} value={s}>{s}</option>)
              : ["success","pending","failed","refunded"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/80">
                {tab === "subscriptions" ? (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/40">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : tab === "subscriptions" ? (
                subs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No subscriptions found.</td></tr>
                ) : subs.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-slate-400">{s.profiles?.full_name ?? "—"}</div>
                      <div className="text-[11px] text-slate-600">{s.user_id.slice(0, 12)}...</div>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-sm font-medium text-white capitalize">{s.plan}</span></td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status] ?? ""}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 capitalize">{s.provider}</td>
                    <td className="px-4 py-3.5 text-sm text-white">{s.amount_inr ? `₹${s.amount_inr}` : "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {s.current_period_end ? `Until ${new Date(s.current_period_end).toLocaleDateString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                txs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No transactions found.</td></tr>
                ) : txs.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-slate-400">{t.user_id.slice(0, 12)}...</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-white">{t.currency === "INR" ? "₹" : "$"}{t.amount}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 capitalize">{t.provider}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 capitalize">{t.plan ?? "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
            <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronLeft size={14} className="text-slate-400" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-30"><ChevronRight size={14} className="text-slate-400" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Add Manual Record</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">User ID</label>
                <input value={createForm.user_id} onChange={e => setCreateForm(f => ({ ...f, user_id: e.target.value }))}
                  placeholder="UUID of user" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              {[
                { label: "Plan", key: "plan", options: ["free","pro","enterprise"] },
                { label: "Billing", key: "billing_cycle", options: ["monthly","yearly","lifetime","one_time"] },
                { label: "Provider", key: "provider", options: ["manual","razorpay","stripe","paddle"] },
                { label: "Status", key: "status", options: ["active","cancelled","trialing"] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
                  <select value={(createForm as Record<string, string>)[key]}
                    onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Amount (INR)</label>
                <input type="number" value={createForm.amount_inr} onChange={e => setCreateForm(f => ({ ...f, amount_inr: e.target.value }))}
                  placeholder="e.g. 999" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !createForm.user_id} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {creating ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
