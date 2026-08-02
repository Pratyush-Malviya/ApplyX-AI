"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, Pencil, Trash2, CheckCircle, RotateCcw, Eye, X, Save, ChevronDown } from "lucide-react";

interface PromptTemplate {
  id: string;
  name: string;
  prompt_type: string;
  task_type: string;
  segment: string;
  content: string;
  variables: string[];
  publish_status: string;
  version: number;
  environment: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  published: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
  archived: "bg-slate-700/50 text-slate-400 border-slate-600",
};

const DEFAULT_FORM = {
  name: "", prompt_type: "system", task_type: "general", segment: "all",
  content: "", description: "", environment: "production", variables: [] as string[],
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [showEditor, setShowEditor] = useState(false);
  const [preview, setPreview] = useState<PromptTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (taskFilter !== "all") params.set("task_type", taskFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/prompts?${params}`);
      const json = await res.json();
      if (res.ok) setPrompts(json.data ?? []);
    } catch {}
    setLoading(false);
  }, [taskFilter, statusFilter]);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  const openCreate = () => { setEditingId(null); setForm({ ...DEFAULT_FORM }); setShowEditor(true); };
  const openEdit = (p: PromptTemplate) => {
    setEditingId(p.id);
    setForm({ name: p.name, prompt_type: p.prompt_type, task_type: p.task_type, segment: p.segment, content: p.content, description: p.description ?? "", environment: p.environment, variables: p.variables ?? [] });
    setShowEditor(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/prompts/${editingId}` : "/api/admin/prompts";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEditor(false); loadPrompts(); }
    } catch {}
    setSaving(false);
  };

  const action = async (id: string, act: "publish" | "rollback" | "delete") => {
    setActionId(id);
    try {
      if (act === "delete") {
        await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/prompts/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: act }),
        });
      }
      loadPrompts();
    } catch {}
    setActionId(null);
  };

  const addVar = (v: string) => { if (v && !form.variables.includes(v)) setForm(f => ({ ...f, variables: [...f.variables, v] })); };
  const removeVar = (v: string) => setForm(f => ({ ...f, variables: f.variables.filter(x => x !== v) }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><MessageSquare size={22} className="text-cyan-400" /> Prompt Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Versioned prompt templates with publish/rollback workflow</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors">
          <Plus size={15} /> New Prompt
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">All Tasks</option>
          {["resume","cover-letter","analyze","general","sales_assist","support_assist","research"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">All Status</option>
          {["draft","published","archived"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Prompts List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-slate-900/60 border border-slate-800/60 rounded-xl animate-pulse" />)
        ) : prompts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
            <p>No prompts yet. Create your first prompt to control AI behaviour.</p>
          </div>
        ) : prompts.map((p) => (
          <div key={p.id} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-white text-sm">{p.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.publish_status] ?? ""}`}>{p.publish_status}</span>
                  <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">v{p.version}</span>
                  <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{p.task_type}</span>
                  <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{p.prompt_type}</span>
                </div>
                {p.description && <p className="text-xs text-slate-500 mb-2">{p.description}</p>}
                <p className="text-xs text-slate-600 font-mono truncate">{p.content.slice(0, 100)}...</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setPreview(p)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-300" title="Preview">
                  <Eye size={14} />
                </button>
                <button onClick={() => openEdit(p)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-300" title="Edit">
                  <Pencil size={14} />
                </button>
                {p.publish_status === "draft" && (
                  <button onClick={() => action(p.id, "publish")} disabled={actionId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs rounded-lg hover:bg-emerald-600/30 transition-colors disabled:opacity-50">
                    <CheckCircle size={12} /> Publish
                  </button>
                )}
                {p.publish_status === "published" && (
                  <button onClick={() => action(p.id, "rollback")} disabled={actionId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 border border-amber-500/40 text-amber-400 text-xs rounded-lg hover:bg-amber-600/30 transition-colors disabled:opacity-50">
                    <RotateCcw size={12} /> Rollback
                  </button>
                )}
                <button onClick={() => action(p.id, "delete")} disabled={actionId === p.id}
                  className="p-2 hover:bg-rose-600/20 rounded-lg transition-colors text-slate-600 hover:text-rose-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0d0f14] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">{editingId ? "Edit Prompt" : "New Prompt"}</h3>
              <button onClick={() => setShowEditor(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Resume System Prompt v2" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Prompt Type", key: "prompt_type", options: ["system","developer","task","persona","industry","output_format","policy","tool_use","guardrail"] },
                  { label: "Task Type", key: "task_type", options: ["general","resume","cover-letter","analyze","sales_assist","support_assist","research"] },
                  { label: "Segment", key: "segment", options: ["all","b2b","b2c"] },
                  { label: "Environment", key: "environment", options: ["development","staging","production"] },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
                    <select value={(form as unknown as Record<string, string>)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of what this prompt does" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Prompt Content *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={10} placeholder="Write your prompt here. Use {variable_name} for dynamic variables."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono resize-y" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-2">Variables (press Enter to add)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.variables.map(v => (
                    <span key={v} className="flex items-center gap-1 text-xs bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1 text-cyan-400">
                      {`{${v}}`} <button onClick={() => removeVar(v)} className="hover:text-rose-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <input onKeyDown={(e) => { if (e.key === "Enter") { addVar((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }}
                  placeholder="user_name, company, industry..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowEditor(false)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.content}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
                <Save size={14} /> {saving ? "Saving..." : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">{preview.name} <span className="text-xs text-slate-500">v{preview.version}</span></h3>
              <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <pre className="p-6 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{preview.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
