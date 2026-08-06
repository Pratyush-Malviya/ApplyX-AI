"use client";

import { useState, useEffect, useCallback } from "react";
import { GitBranch, Plus, Pencil, Trash2, CheckCircle, ToggleLeft, ToggleRight, X, Save } from "lucide-react";

interface ModelRoute {
  id: string;
  name: string;
  task_type: string;
  segment: string;
  priority: number;
  enabled: boolean;
  primary_model: { provider: string; model: string; displayName: string };
  fallback_models: Array<{ provider: string; model: string; displayName: string }>;
  temperature: number;
  max_tokens: number;
  timeout_ms: number;
  retry_count: number;
  publish_status: string;
  description: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  published: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
};

const DEFAULT_FORM = {
  name: "", description: "", task_type: "general", segment: "all", priority: 10, enabled: true,
  temperature: 0.7, max_tokens: 4096, timeout_ms: 30000, retry_count: 2,
  primary_model: { provider: "gemini", model: "gemini-2.5-pro", displayName: "Google Gemini 2.5 Pro" },
  fallback_models: [] as Array<{ provider: string; model: string; displayName: string }>,
};

const PREADDED_ROUTES: ModelRoute[] = [
  {
    id: "route-resume-exec",
    name: "Executive Resume & ATS Router",
    description: "Primary route for ATS keyword matching and executive STAR bullet re-writing.",
    task_type: "resume",
    segment: "pro",
    priority: 1,
    enabled: true,
    publish_status: "published",
    temperature: 0.3,
    max_tokens: 4096,
    timeout_ms: 30000,
    retry_count: 2,
    primary_model: { provider: "gemini", model: "gemini-2.5-pro", displayName: "Google Gemini 2.5 Pro" },
    fallback_models: [
      { provider: "openrouter", model: "deepseek/deepseek-chat", displayName: "DeepSeek V3 (OpenRouter)" },
      { provider: "groq", model: "llama-3.3-70b-versatile", displayName: "Groq LLaMA 3.3 70B" },
    ],
  },
  {
    id: "route-cover-letter",
    name: "STAR Cover Letter Generator",
    description: "High-persuasion cover letter generation tailored to candidate experience.",
    task_type: "cover-letter",
    segment: "free",
    priority: 1,
    enabled: true,
    publish_status: "published",
    temperature: 0.7,
    max_tokens: 2048,
    timeout_ms: 25000,
    retry_count: 2,
    primary_model: { provider: "openrouter", model: "deepseek/deepseek-chat", displayName: "DeepSeek V3" },
    fallback_models: [
      { provider: "gemini", model: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash" },
    ],
  },
  {
    id: "route-ats-analyzer",
    name: "ATS Match Score & Gap Analyzer",
    description: "Deep semantic analysis comparing candidate skills vs target job descriptions.",
    task_type: "analyze",
    segment: "all",
    priority: 1,
    enabled: true,
    publish_status: "published",
    temperature: 0.2,
    max_tokens: 3072,
    timeout_ms: 20000,
    retry_count: 2,
    primary_model: { provider: "openrouter", model: "qwen/qwen-2.5-72b-instruct", displayName: "Qwen 2.5 72B Instruct" },
    fallback_models: [
      { provider: "cerebras", model: "llama3.1-70b", displayName: "Cerebras Ultra-Fast LLaMA" },
    ],
  },
  {
    id: "route-salary-copilot",
    name: "Salary Counter-Offer Negotiator",
    description: "CTC analysis and high-leverage compensation counter-offer script generation.",
    task_type: "salary-copilot",
    segment: "enterprise",
    priority: 1,
    enabled: true,
    publish_status: "published",
    temperature: 0.4,
    max_tokens: 2048,
    timeout_ms: 20000,
    retry_count: 2,
    primary_model: { provider: "gemini", model: "gemini-2.5-pro", displayName: "Google Gemini 2.5 Pro" },
    fallback_models: [],
  },
];

export default function RoutesPage() {
  const [routes, setRoutes] = useState<ModelRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [primaryStr, setPrimaryStr] = useState('{"provider":"gemini","model":"gemini-2.5-pro","displayName":"Google Gemini 2.5 Pro"}');
  const [fallbacksStr, setFallbacksStr] = useState('[]');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/routes");
      const json = await res.json();
      if (res.ok && json.data && json.data.length > 0) {
        setRoutes(json.data);
      } else {
        setRoutes(PREADDED_ROUTES);
      }
    } catch {
      setRoutes(PREADDED_ROUTES);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null); setForm({ ...DEFAULT_FORM });
    setPrimaryStr('{"provider":"gemini","model":"gemini-2.5-pro","displayName":"Google Gemini 2.5 Pro"}');
    setFallbacksStr("[]"); setShowEditor(true);
  };

  const openEdit = (r: ModelRoute) => {
    setEditingId(r.id); setShowEditor(true);
    setForm({ name: r.name, description: r.description ?? "", task_type: r.task_type, segment: r.segment, priority: r.priority, enabled: r.enabled, temperature: r.temperature, max_tokens: r.max_tokens, timeout_ms: r.timeout_ms, retry_count: r.retry_count, primary_model: r.primary_model, fallback_models: r.fallback_models });
    setPrimaryStr(JSON.stringify(r.primary_model, null, 2));
    setFallbacksStr(JSON.stringify(r.fallback_models, null, 2));
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...form, primary_model: JSON.parse(primaryStr), fallback_models: JSON.parse(fallbacksStr) };
      const url = editingId ? `/api/admin/routes/${editingId}` : "/api/admin/routes";
      const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setShowEditor(false); load(); }
    } catch {} finally { setSaving(false); }
  };

  const toggleEnabled = async (r: ModelRoute) => {
    setActionId(r.id);
    await fetch(`/api/admin/routes/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !r.enabled }) });
    load(); setActionId(null);
  };

  const publish = async (id: string) => {
    setActionId(id);
    await fetch(`/api/admin/routes/${id}/publish`, { method: "POST" });
    load(); setActionId(null);
  };

  const del = async (id: string) => {
    setActionId(id);
    await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
    load(); setActionId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><GitBranch size={22} className="text-green-400" /> Model Routing</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Configure model priority chains and fallback rules per task type</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors cursor-pointer">
          <Plus size={15} /> New Route
        </button>
      </div>

      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />) :
          routes.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-white text-sm">{r.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.publish_status] ?? "bg-slate-800 text-slate-300 border-slate-700"}`}>{r.publish_status}</span>
                    <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">{r.task_type}</span>
                    <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Priority {r.priority}</span>
                    <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">temp: {r.temperature}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{r.description}</p>
                  <div className="text-xs text-slate-300">
                    Primary: <span className="text-cyan-400 font-bold">{r.primary_model?.displayName ?? r.primary_model?.model}</span>
                    {r.fallback_models?.length > 0 && <span className="text-slate-400"> → {r.fallback_models.map(f => f.displayName ?? f.model).join(" → ")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleEnabled(r)} disabled={actionId === r.id} className="text-slate-500 hover:text-slate-300 p-2">
                    {r.enabled ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300"><Pencil size={14} /></button>
                  {r.publish_status === "draft" && (
                    <button onClick={() => publish(r.id)} disabled={actionId === r.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs rounded-lg hover:bg-emerald-600/30 transition-colors disabled:opacity-50">
                      <CheckCircle size={12} /> Publish
                    </button>
                  )}
                  <button onClick={() => del(r.id)} disabled={actionId === r.id} className="p-2 hover:bg-rose-600/20 rounded-lg text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0d0f14] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">{editingId ? "Edit Route" : "New Route"}</h3>
              <button onClick={() => setShowEditor(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Route Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Task Type", key: "task_type", options: ["general","resume","cover-letter","analyze","sales_assist","support_assist","research","chat","summarization"] },
                  { label: "Segment", key: "segment", options: ["all","b2b","b2c"] },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
                    <select value={(form as unknown as Record<string, string | number | boolean>)[key] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                {[
                  { label: "Priority (lower = higher)", key: "priority", type: "number" },
                  { label: "Temperature", key: "temperature", type: "number" },
                  { label: "Max Tokens", key: "max_tokens", type: "number" },
                  { label: "Retry Count", key: "retry_count", type: "number" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
                    <input type={type} value={(form as unknown as Record<string, string | number | boolean>)[key] as number}
                      onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Primary Model (JSON)</label>
                <textarea value={primaryStr} onChange={e => setPrimaryStr(e.target.value)} rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Fallback Models (JSON array)</label>
                <textarea value={fallbacksStr} onChange={e => setFallbacksStr(e.target.value)} rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono resize-none" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowEditor(false)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300">Cancel</button>
              <button onClick={save} disabled={saving || !form.name} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
                <Save size={14} /> {saving ? "Saving..." : "Save Route"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
