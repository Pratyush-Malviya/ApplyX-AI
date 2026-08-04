"use client";

import { useState, useEffect } from "react";
import {
  Users, Cpu, Zap, TrendingUp, CreditCard, AlertCircle,
  RefreshCw, Shield, Database, Sparkles, Activity,
  Server, Globe, Layers, ChevronDown, ChevronUp, Copy, Check,
  ToggleLeft, ToggleRight, Trash2, Plus, Save
} from "lucide-react";

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

const ACTIVE_MODELS = [
  { name: "Gemini 2.5 Pro", task: "Resume & ATS", provider: "Gemini API", latency: "~420ms", active: true },
  { name: "DeepSeek V3", task: "Cover Letters", provider: "OpenRouter", latency: "~650ms", active: true },
  { name: "Qwen3 235B", task: "Long-form Writing", provider: "OpenRouter", latency: "~580ms", active: true },
  { name: "LLaMA 3.3 70B", task: "Groq Fallback", provider: "Groq", latency: "~180ms", active: true },
  { name: "Cerebras LLaMA", task: "Ultra-fast Speed", provider: "Cerebras", latency: "~90ms", active: true },
];

const SYSTEM_SERVICES = [
  { name: "AI Gateway Router", detail: "LiteLLM Multi-Model", icon: Server },
  { name: "Redis Cache", detail: "Upstash REST API", icon: Zap },
  { name: "Vector DB", detail: "Qdrant Semantic Store", icon: Database },
  { name: "PostgreSQL", detail: "Supabase Cloud", icon: Globe },
];

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Icon size={16} className="text-blue-600" />
          </div>
          <span className="font-bold text-gray-900 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState("");
  const [copied, setCopied] = useState("");
  const [models, setModels] = useState(ACTIVE_MODELS);
  const DEFAULT_SYSTEM_PROMPT = `You are a Principal Executive Career Strategist, Elite ATS Optimization Specialist, and Senior Technical Resume Architect. Rewrite the candidate's resume to match the target job description.

Rules:
1. CRITICAL: The entire resume MUST fit on ONE page. Be concise — use tight bullet points (1 line each max), compact sections, and no filler text.
2. TOP HEADER REQUIRED: Line 1 MUST be "# Candidate Name". Line 2 MUST be the contact details line (Email | Phone | Location | LinkedIn).
3. PRESERVE ALL factual data (company names, dates, job titles, education, certifications).
4. NEVER fabricate false experience or companies.
5. REWRITE ALL bullet points using the STAR method (Situation/Task -> Action -> Quantified Result).
6. START EVERY BULLET with high-impact action verbs (Engineered, Spearheaded, Architected, Optimized, Orchestrated).
7. INTEGRATE EXACT ATS KEYWORDS from the job description for maximum match score.
8. QUANTIFY IMPACT with realistic metrics (%, $, latency, scale, time saved).
9. Reorder skills section to prioritize JD-required skills.
10. Update summary/profile to 2-3 lines max highlighting core strengths for this role.
11. Limit work experience to 3-4 bullet points per role.`;

  const [promptText, setPromptText] = useState(DEFAULT_SYSTEM_PROMPT);

  useEffect(() => {
    loadStats();
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("applyx_admin_system_prompt");
      if (saved) {
        setPromptText(saved);
      }
    }
  }, [days]);

  const handleSavePrompt = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("applyx_admin_system_prompt", promptText);
    }
    try {
      await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Executive ATS Resume System Prompt",
          prompt_type: "system",
          task_type: "resume",
          content: promptText,
        }),
      });
    } catch {}
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 3000);
  };

  const statsList = stats ? [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsers} new`, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Pro Subscribers", value: stats.proUsers.toLocaleString(), sub: `${stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% conversion`, icon: Zap, color: "text-violet-600 bg-violet-50 border-violet-200" },
    { label: "AI Calls", value: stats.aiCalls.toLocaleString(), sub: `Last ${days} days`, icon: Cpu, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
    { label: "Cache Hit Rate", value: `${stats.cacheHitRate}%`, sub: `${stats.cachedCalls.toLocaleString()} saved`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Revenue (INR)", value: `₹${stats.revenueInr.toLocaleString()}`, sub: `Last ${days} days`, icon: CreditCard, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Errors", value: stats.errors, sub: "Auto-failovers", icon: AlertCircle, color: "text-rose-600 bg-rose-50 border-rose-200" },
  ] : [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage AI models, users, cache, and system settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Last 24h</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
          <button
            onClick={loadStats}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-24" />
            ))
          : statsList.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 shadow-sm">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${stat.color}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-gray-900">{stat.value}</div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</div>
                    <div className="text-[10px] text-gray-400">{stat.sub}</div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Cache Control */}
      <Section title="Cache & System Control" icon={RefreshCw}>
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Flush Redis & Config Cache</p>
            <p className="text-xs text-gray-500 mt-0.5">Clears all cached AI responses and configuration. Users will see fresh results immediately.</p>
          </div>
          <button
            onClick={handlePurge}
            disabled={purging}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 shrink-0 transition-colors"
          >
            <RefreshCw size={14} className={purging ? "animate-spin" : ""} />
            {purging ? "Purging..." : "Purge Cache"}
          </button>
        </div>
        {purgeMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
            <Check size={13} /> {purgeMsg}
          </div>
        )}

        {/* System Services Status */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {SYSTEM_SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
              <div key={svc.name} className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-800 truncate">{svc.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* AI Model Control */}
      <Section title="AI Model Routing" icon={Layers}>
        <div className="pt-4 space-y-2">
          {models.map((m, idx) => (
            <div key={m.name} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${m.active ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200 opacity-60"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${m.active ? "bg-emerald-400" : "bg-gray-300"}`} />
                <div>
                  <div className="text-xs font-bold text-gray-900">{m.name}</div>
                  <div className="text-[10px] text-gray-500">{m.task} · {m.provider} · <span className="text-emerald-600 font-mono">{m.latency}</span></div>
                </div>
              </div>
              <button
                onClick={() => toggleModel(idx)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title={m.active ? "Disable" : "Enable"}
              >
                {m.active
                  ? <ToggleRight size={24} className="text-blue-600" />
                  : <ToggleLeft size={24} className="text-gray-300" />}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Prompt Manager */}
      <Section title="System Prompt" icon={Cpu} defaultOpen={false}>
        <div className="pt-4 space-y-3">
          <p className="text-xs text-gray-500">Edit the base system prompt sent to all AI models for resume tailoring.</p>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePrompt}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {promptSaved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save Prompt</>}
            </button>
            <button
              onClick={() => copyToClipboard(promptText, "prompt")}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copied === "prompt" ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        </div>
      </Section>

      {/* Guardrails */}
      <Section title="Guardrails & Safety" icon={Shield} defaultOpen={false}>
        <div className="pt-4 space-y-3">
          {[
            { label: "Block harmful content generation", enabled: true },
            { label: "Prevent resume fabrication", enabled: true },
            { label: "Rate limit: 20 AI calls per user/day (free tier)", enabled: true },
            { label: "Admin-only: bypass rate limits", enabled: false },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-xs font-medium text-gray-800">{rule.label}</span>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rule.enabled ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                {rule.enabled ? "Active" : "Inactive"}
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}
