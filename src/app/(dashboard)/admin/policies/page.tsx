"use client";

import { useState } from "react";
import { Settings2, Save, RefreshCw } from "lucide-react";

interface PolicyForm {
  tone: string;
  length: string;
  style: string;
  creativity: number;
  reading_level: string;
  verbosity_ceiling: number;
  emoji_allowed: boolean;
  force_headings: boolean;
  force_structured: boolean;
  force_disclaimers: boolean;
  force_summary_first: boolean;
  force_action_items: boolean;
  force_citations: boolean;
  cache_enabled: boolean;
  cache_ttl_seconds: number;
  cache_scope: string;
  segment: string;
  name: string;
}

const DEFAULT: PolicyForm = {
  name: "Default Policy", segment: "all", tone: "professional", length: "medium",
  style: "paragraph", creativity: 5, reading_level: "professional", verbosity_ceiling: 800,
  emoji_allowed: false, force_headings: false, force_structured: false,
  force_disclaimers: false, force_summary_first: false, force_action_items: false,
  force_citations: false, cache_enabled: true, cache_ttl_seconds: 86400, cache_scope: "global",
};

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/40 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-300">{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-violet-600" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5.5 left-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function PoliciesPage() {
  const [form, setForm] = useState<PolicyForm>({ ...DEFAULT });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof PolicyForm, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/policies", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings2 size={22} className="text-orange-400" /> Output Policy</h1>
          <p className="text-slate-500 text-sm mt-1">Control tone, format, length, and quality of AI-generated output</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50">
          <Save size={14} /> {saved ? "Saved!" : saving ? "Saving..." : "Save & Publish"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Output Style */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-800/60 pb-2">Output Style</h2>
          {[
            { label: "Tone", key: "tone", options: ["formal","friendly","concise","assertive","technical","professional","casual","expert","sales","support"] },
            { label: "Length", key: "length", options: ["short","medium","long"] },
            { label: "Style", key: "style", options: ["bullet","paragraph","table","json","markdown","mixed"] },
            { label: "Reading Level", key: "reading_level", options: ["simple","standard","professional","expert"] },
            { label: "Segment", key: "segment", options: ["all","b2b","b2c"] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
              <select value={(form as unknown as Record<string, string | number | boolean>)[key] as string}
                onChange={e => set(key as keyof PolicyForm, e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-400 font-medium">Creativity Level</label>
              <span className="text-xs text-violet-400 font-mono">{form.creativity}/10</span>
            </div>
            <input type="range" min={1} max={10} value={form.creativity} onChange={e => set("creativity", Number(e.target.value))} className="w-full accent-violet-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Verbosity Ceiling (tokens)</label>
            <input type="number" value={form.verbosity_ceiling} onChange={e => set("verbosity_ceiling", Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Policy Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
        </div>

        {/* Quality Knobs + Cache */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-800/60 pb-2 mb-1">Quality Rules</h2>
            <ToggleRow label="Force Headings" desc="Require structured H2/H3 headings" value={form.force_headings} onChange={v => set("force_headings", v)} />
            <ToggleRow label="Force Structured Output" desc="Require JSON or schema-defined format" value={form.force_structured} onChange={v => set("force_structured", v)} />
            <ToggleRow label="Force Disclaimers" desc="Append legal/compliance notes" value={form.force_disclaimers} onChange={v => set("force_disclaimers", v)} />
            <ToggleRow label="Summary First" desc="Lead with executive summary" value={form.force_summary_first} onChange={v => set("force_summary_first", v)} />
            <ToggleRow label="Force Action Items" desc="End with actionable next steps" value={form.force_action_items} onChange={v => set("force_action_items", v)} />
            <ToggleRow label="Force Citations" desc="Require evidence references" value={form.force_citations} onChange={v => set("force_citations", v)} />
            <ToggleRow label="Allow Emoji" desc="Permit emoji in responses" value={form.emoji_allowed} onChange={v => set("emoji_allowed", v)} />
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-800/60 pb-2 mb-1">Cache Policy</h2>
            <ToggleRow label="Cache Enabled" value={form.cache_enabled} onChange={v => set("cache_enabled", v)} />
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Cache TTL (seconds)</label>
                <input type="number" value={form.cache_ttl_seconds} onChange={e => set("cache_ttl_seconds", Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Cache Scope</label>
                <select value={form.cache_scope} onChange={e => set("cache_scope", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                  {["session","user","tenant","global"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
