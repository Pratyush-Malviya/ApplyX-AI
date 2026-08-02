"use client";

import { useState, useEffect } from "react";
import { Users, Cpu, Zap, TrendingUp, CreditCard, AlertCircle, RefreshCw, Shield, Database } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  newUsers: number;
  proUsers: number;
  aiCalls: number;
  cachedCalls: number;
  cacheHitRate: number;
  errors: number;
  revenueInr: number;
  days: number;
}

function StatCard({ label, value, sub, icon: Icon, color, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const card = (
    <div className={`relative bg-slate-900/60 border rounded-xl p-5 hover:border-slate-600 transition-all group cursor-default ${href ? "cursor-pointer hover:scale-[1.02]" : ""}`}
      style={{ borderColor: "rgba(100,116,139,0.3)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} className="text-white" />
        </div>
        {href && <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">View →</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs font-medium text-slate-400">{label}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function QuickAction({ label, icon: Icon, href, desc }: { label: string; icon: React.ElementType; href: string; desc: string }) {
  return (
    <Link href={href} className="flex items-start gap-3 p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl hover:bg-slate-800/60 hover:border-slate-700 transition-all group">
      <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-violet-400" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState("");

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`);
      const json = await res.json();
      if (res.ok) setStats(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, [days]);

  const handlePurge = async () => {
    setPurging(true);
    setPurgeMsg("");
    try {
      const res = await fetch("/api/admin/cache/purge", { method: "POST" });
      const json = await res.json();
      setPurgeMsg(json.message ?? "Cache purged!");
    } catch { setPurgeMsg("Purge failed."); }
    setPurging(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Control center for ApplyX AI operations</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          >
            <option value={1}>Last 24h</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button onClick={loadStats} className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
            <RefreshCw size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} sub={`+${stats.newUsers} new (${days}d)`} icon={Users} color="bg-blue-600" href="/admin/users" />
          <StatCard label="Pro Users" value={stats.proUsers.toLocaleString()} sub={`${stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% of total`} icon={Zap} color="bg-violet-600" href="/admin/payments" />
          <StatCard label="AI Calls" value={stats.aiCalls.toLocaleString()} sub={`Last ${days} days`} icon={Cpu} color="bg-cyan-600" />
          <StatCard label="Cache Hit Rate" value={`${stats.cacheHitRate}%`} sub={`${stats.cachedCalls} cached calls`} icon={TrendingUp} color="bg-emerald-600" />
          <StatCard label="Revenue (INR)" value={`₹${stats.revenueInr.toLocaleString()}`} sub={`Last ${days} days`} icon={CreditCard} color="bg-amber-600" href="/admin/payments" />
          <StatCard label="Errors" value={stats.errors} sub="AI call failures" icon={AlertCircle} color="bg-rose-600" href="/admin/logs" />
          <StatCard label="DB Tables" value="13" sub="Admin schemas active" icon={Database} color="bg-slate-600" />
          <StatCard label="Guardrails" value="Active" sub="Safety rules running" icon={Shield} color="bg-teal-600" href="/admin/guardrails" />
        </div>
      ) : (
        <div className="text-slate-500 text-sm">Failed to load stats. Make sure you have admin access.</div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction label="Manage Users" icon={Users} href="/admin/users" desc="View, edit plans, suspend accounts" />
          <QuickAction label="Edit Prompts" icon={Shield} href="/admin/prompts" desc="Update system prompts, publish versions" />
          <QuickAction label="Configure Routing" icon={Cpu} href="/admin/routes" desc="Set model priority and fallbacks" />
          <QuickAction label="Output Policy" icon={Zap} href="/admin/policies" desc="Tone, format, temperature controls" />
          <QuickAction label="AI Testing Lab" icon={TrendingUp} href="/admin/testing" desc="Test prompts and compare models" />
          <QuickAction label="Payment Records" icon={CreditCard} href="/admin/payments" desc="View and manage subscriptions" />
        </div>
      </div>

      {/* Cache Purge */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Cache Control</h3>
            <p className="text-xs text-slate-500">Purge the in-memory admin config cache and Redis LLM response cache. Use after publishing a new prompt or routing rule.</p>
            {purgeMsg && <p className="text-xs text-emerald-400 mt-2">✓ {purgeMsg}</p>}
          </div>
          <button
            onClick={handlePurge}
            disabled={purging}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-600/20 border border-rose-500/40 text-rose-400 text-sm font-medium rounded-lg hover:bg-rose-600/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={purging ? "animate-spin" : ""} />
            {purging ? "Purging..." : "Purge Cache"}
          </button>
        </div>
      </div>
    </div>
  );
}
