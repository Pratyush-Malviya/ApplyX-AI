"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Plus, Trash2, ToggleLeft, ToggleRight, X, Save } from "lucide-react";

interface GuardrailRule {
  id: string;
  name: string;
  category: string;
  description: string | null;
  rule_text: string;
  severity: string;
  enabled: boolean;
  refusal_template: string | null;
  escalate_to_human: boolean;
}

const SEV_COLORS: Record<string, string> = {
  low: "bg-slate-700/50 text-slate-400 border-slate-600",
  medium: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  high: "bg-orange-600/20 text-orange-400 border-orange-500/40",
  critical: "bg-rose-600/20 text-rose-400 border-rose-500/40",
};

const DEFAULT_RULE = {
  name: "", category: "content_refusal", description: "", rule_text: "",
  severity: "medium", enabled: true, refusal_template: "", escalate_to_human: false,
};

export default function GuardrailsPage() {
  const [rules, setRules] = useState<GuardrailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_RULE });
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guardrails");
      const json = await res.json();
      if (res.ok) setRules(json.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/guardrails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowEditor(false); load(); }
    } catch {} finally { setSaving(false); }
  };

  const toggle = async (r: GuardrailRule) => {
    setActionId(r.id);
    await fetch(`/api/admin/guardrails/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !r.enabled }) });
    load(); setActionId(null);
  };

  const del = async (id: string) => {
    setActionId(id);
    await fetch(`/api/admin/guardrails/${id}`, { method: "DELETE" });
    load(); setActionId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck size={22} className="text-teal-400" /> Safety Guardrails</h1>
          <p className="text-slate-500 text-sm mt-1">Content safety rules with severity levels and refusal templates</p>
        </div>
        <button onClick={() => { setForm({ ...DEFAULT_RULE }); setShowEditor(true); }} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors">
          <Plus size={15} /> New Rule
        </button>
      </div>

      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-slate-900/60 border border-slate-800/60 rounded-xl animate-pulse" />) :
          rules.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
              <p>No guardrail rules. Add rules to enforce content safety policies.</p>
            </div>
          ) : rules.map((r) => (
            <div key={r.id} className={`bg-slate-900/60 border rounded-xl p-4 transition-colors ${r.enabled ? "border-slate-800/60" : "border-slate-800/30 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white text-sm">{r.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_COLORS[r.severity] ?? ""}`}>{r.severity}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{r.category.replace(/_/g, " ")}</span>
                    {r.escalate_to_human && <span className="text-[10px] text-rose-400 bg-rose-600/10 border border-rose-500/30 px-2 py-0.5 rounded-full">escalates</span>}
                  </div>
                  {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggle(r)} disabled={actionId === r.id} className="p-2 text-slate-500 hover:text-slate-300">
                    {r.enabled ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => del(r.id)} disabled={actionId === r.id} className="p-2 hover:bg-rose-600/20 rounded-lg text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0d0f14] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">New Guardrail Rule</h3>
              <button onClick={() => setShowEditor(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs text-slate-400 font-medium mb-1">Rule Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 font-medium mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    {["language","content_refusal","legal_disclaimer","pii_handling","sensitive_data","hallucination","brand_safety","spam_abuse","restricted_topic","custom"].map(o => <option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
                  </select></div>
                <div><label className="block text-xs text-slate-400 font-medium mb-1">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    {["low","medium","high","critical"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs text-slate-400 font-medium mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
              <div><label className="block text-xs text-slate-400 font-medium mb-1">Rule Text / Instruction *</label>
                <textarea value={form.rule_text} onChange={e => setForm(f => ({ ...f, rule_text: e.target.value }))} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none" /></div>
              <div><label className="block text-xs text-slate-400 font-medium mb-1">Refusal Template (shown to user on violation)</label>
                <textarea value={form.refusal_template ?? ""} onChange={e => setForm(f => ({ ...f, refusal_template: e.target.value }))} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none" /></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.escalate_to_human} onChange={e => setForm(f => ({ ...f, escalate_to_human: e.target.checked }))} className="w-4 h-4 rounded border-slate-600 accent-violet-500" />
                <span className="text-sm text-slate-300">Escalate to human review on violation</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowEditor(false)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.rule_text} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
                <Save size={14} /> {saving ? "Saving..." : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
