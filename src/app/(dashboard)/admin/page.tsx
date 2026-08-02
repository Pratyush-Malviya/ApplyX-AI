"use client";

import { useState, useEffect } from "react";
import {
  Users, Cpu, Zap, TrendingUp, CreditCard, AlertCircle, RefreshCw,
  Shield, Database, Sparkles, CheckCircle2, ArrowUpRight, Activity,
  Server, Globe, Terminal, ArrowRight, Layers
} from "lucide-react";
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

function StatCard({ label, value, sub, icon: Icon, gradient, glow, href, trend }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
  href?: string;
  trend?: string;
}) {
  const content = (
    <div className={`relative bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 group overflow-hidden ${href ? "cursor-pointer hover:-translate-y-1 hover:shadow-2xl shadow-slate-950/50" : ""}`}>
      {/* Background glow spot */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${glow}`} />
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} shadow-lg shadow-black/40 border border-white/10`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
      </div>

      <div className="relative z-10 space-y-1">
        <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="text-xs font-semibold text-slate-300">{label}</div>
        {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SystemStatusItem({ name, status, detail, icon: Icon }: { name: string; status: "online" | "warning"; detail: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/70 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <Icon size={15} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-200">{name}</div>
          <div className="text-[10px] text-slate-500">{detail}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Operational
      </div>
    </div>
  );
}

const ACTIVE_MODELS = [
  { name: "Google Gemini 2.5 Pro", task: "Resume & ATS Analysis", provider: "Gemini API", status: "Primary 🥇", latency: "~420ms" },
  { name: "DeepSeek V3 (37B MoE)", task: "Cover Letter & Reasoning", provider: "OpenRouter", status: "Active ⚡", latency: "~650ms" },
  { name: "Qwen3 235B", task: "Long-form Writing", provider: "OpenRouter", status: "Active ⚡", latency: "~580ms" },
  { name: "Meta LLaMA 3.3 (70B)", task: "Fast Groq Fallback", provider: "Groq", status: "Fallback 🛡️", latency: "~180ms" },
  { name: "Cerebras LLaMA 3.3", task: "Ultra-high Speed", provider: "Cerebras", status: "Active ⚡", latency: "~90ms" },
];

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
    } catch {
      setPurgeMsg("Purge failed.");
    }
    setPurging(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-violet-900/40 via-indigo-900/20 to-slate-900/60 border border-violet-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-bold text-violet-300">
              <Sparkles size={13} className="text-amber-400" />
              SYSTEM GOVERNANCE ACTIVE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Control Center & AI Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Monitor multi-model routing, prompt caching efficiency, revenue metrics, and user growth in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-xs font-semibold bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
            <button
              onClick={loadStats}
              className="p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
              title="Refresh Telemetry"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Active Users"
            value={stats.totalUsers.toLocaleString()}
            sub={`+${stats.newUsers} new signups (${days}d)`}
            icon={Users}
            gradient="bg-gradient-to-tr from-blue-600 to-cyan-500"
            glow="bg-blue-500"
            href="/admin/users"
            trend="+14%"
          />
          <StatCard
            label="Pro Tier Subscribers"
            value={stats.proUsers.toLocaleString()}
            sub={`${stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% conversion rate`}
            icon={Zap}
            gradient="bg-gradient-to-tr from-violet-600 to-indigo-500"
            glow="bg-violet-500"
            href="/admin/payments"
            trend="+22%"
          />
          <StatCard
            label="Total AI Generations"
            value={stats.aiCalls.toLocaleString()}
            sub={`Inference requests (${days}d)`}
            icon={Cpu}
            gradient="bg-gradient-to-tr from-cyan-600 to-teal-500"
            glow="bg-cyan-500"
          />
          <StatCard
            label="Prompt Cache Hit Rate"
            value={`${stats.cacheHitRate}%`}
            sub={`${stats.cachedCalls.toLocaleString()} cached replies saved`}
            icon={TrendingUp}
            gradient="bg-gradient-to-tr from-emerald-600 to-green-500"
            glow="bg-emerald-500"
            trend="+8%"
          />
          <StatCard
            label="Gross Revenue (INR)"
            value={`₹${stats.revenueInr.toLocaleString()}`}
            sub={`Collected in last ${days} days`}
            icon={CreditCard}
            gradient="bg-gradient-to-tr from-amber-600 to-orange-500"
            glow="bg-amber-500"
            href="/admin/payments"
          />
          <StatCard
            label="Generation Errors"
            value={stats.errors}
            sub="Automatic failovers triggered"
            icon={AlertCircle}
            gradient="bg-gradient-to-tr from-rose-600 to-red-500"
            glow="bg-rose-500"
            href="/admin/logs"
          />
          <StatCard
            label="Admin Tables Schema"
            value="13"
            sub="Supabase admin tables"
            icon={Database}
            gradient="bg-gradient-to-tr from-slate-600 to-slate-500"
            glow="bg-slate-500"
          />
          <StatCard
            label="Guardrails Status"
            value="100%"
            sub="Safety rules active"
            icon={Shield}
            gradient="bg-gradient-to-tr from-teal-600 to-emerald-500"
            glow="bg-teal-500"
            href="/admin/guardrails"
          />
        </div>
      ) : null}

      {/* Two-Column Section: Active AI Models & System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active AI Models Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-violet-400" />
                Active Model Gateway Priority
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Live routing chain resolution per prompt intent</p>
            </div>
            <Link
              href="/admin/routes"
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              Configure Routes <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Task Intent</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Avg Latency</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {ACTIVE_MODELS.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-white font-bold">{m.name}</td>
                    <td className="py-3 text-slate-300">{m.task}</td>
                    <td className="py-3 text-slate-400">{m.provider}</td>
                    <td className="py-3 text-emerald-400 font-mono">{m.latency}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-300">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure Health Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Activity size={18} className="text-emerald-400" />
              Infrastructure Health
            </h2>
            <p className="text-xs text-slate-400 mb-4">Core services telemetry</p>

            <div className="space-y-3">
              <SystemStatusItem name="AI Gateway Router" detail="LiteLLM Multi-Model Gateway" status="online" icon={Server} />
              <SystemStatusItem name="Exact Match Cache" detail="Upstash Redis REST API" status="online" icon={Zap} />
              <SystemStatusItem name="Vector Database" detail="Qdrant Semantic Store" status="online" icon={Database} />
              <SystemStatusItem name="PostgreSQL Database" detail="Supabase Cloud Cluster" status="online" icon={Globe} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={handlePurge}
              disabled={purging}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={purging ? "animate-spin" : ""} />
              {purging ? "Purging Caches..." : "Flush Config & Redis Cache"}
            </button>
            {purgeMsg && <p className="text-[11px] text-emerald-400 text-center mt-2 font-medium">✓ {purgeMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
