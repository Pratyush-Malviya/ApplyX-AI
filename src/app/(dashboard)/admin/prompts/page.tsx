"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, Pencil, Trash2, CheckCircle, RotateCcw, Eye, X, Save, Copy, Check } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

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
  const { toast } = useToast();
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyPromptText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast("Prompt Content Copied!", "Content copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
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
      const json = await res.json();
      if (res.ok) {
        setShowEditor(false);
        toast(editingId ? "Prompt Updated" : "Prompt Created", `"${form.name}" saved as draft.`, "success");
        loadPrompts();
      } else {
        toast("Failed to Save Prompt", json.error ?? "Save failed", "error");
      }
    } catch {
      toast("Error", "Network request error", "error");
    }
    setSaving(false);
  };

  const action = async (id: string, act: "publish" | "rollback" | "delete") => {
    setActionId(id);
    try {
      if (act === "delete") {
        const res = await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
        if (res.ok) toast("Prompt Deleted", "Prompt template deleted.", "info");
      } else {
        const res = await fetch(`/api/admin/prompts/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: act }),
        });
        if (res.ok) toast(`Prompt ${act === "publish" ? "Published" : "Rolled Back"}`, `Prompt status updated to ${act}.`, "success");
      }
      loadPrompts();
    } catch {
      toast("Action Failed", "Could not complete request.", "error");
    }
    setActionId(null);
  };

  const addVar = (v: string) => { if (v && !form.variables.includes(v)) setForm(f => ({ ...f, variables: [...f.variables, v] })); };
  const removeVar = (v: string) => setForm(f => ({ ...f, variables: f.variables.filter(x => x !== v) }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Admin / AI Governance</div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><MessageSquare size={22} className="text-cyan-400" /> Prompt Manager</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Versioned prompt templates with publish/rollback workflow</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-violet-600/30 cursor-pointer">
          <Plus size={15} /> New Prompt Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500">
          <option value="all">All Tasks</option>
          {["resume","cover-letter","analyze","general","sales_assist","support_assist","research"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500">
          <option value="all">All Status</option>
          {["draft","published","archived"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Prompts List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-900/60 border border-slate-800/60 rounded-2xl animate-pulse" />)
        ) : prompts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30 text-cyan-400" />
            <p className="text-sm font-medium text-slate-300">No prompt templates found.</p>
            <p className="text-xs text-slate-500 mt-1">Create your first system prompt to govern AI generations.</p>
          </div>
        ) : prompts.map((p) => (
          <div key={p.id} className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all group">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-bold text-white text-sm">{p.name}</span>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[p.publish_status] ?? ""}`}>{p.publish_status}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono">v{p.version}</span>
                  <span className="text-[10px] text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full font-semibold">{p.task_type}</span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">{p.prompt_type}</span>
                </div>
                {p.description && <p className="text-xs text-slate-400 mb-2">{p.description}</p>}
                <p className="text-xs text-slate-500 font-mono truncate bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5">{p.content.slice(0, 120)}...</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => copyPromptText(p.content, p.id)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white" title="Copy Prompt Text">
                  {copiedId === p.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button onClick={() => setPreview(p)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white" title="Preview">
                  <Eye size={14} />
                </button>
                <button onClick={() => openEdit(p)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white" title="Edit">
                  <Pencil size={14} />
                </button>
                {p.publish_status === "draft" && (
                  <button onClick={() => action(p.id, "publish")} disabled={actionId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer">
                    <CheckCircle size={12} /> Publish
                  </button>
                )}
                {p.publish_status === "published" && (
                  <button onClick={() => action(p.id, "rollback")} disabled={actionId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer">
                    <RotateCcw size={12} /> Rollback
                  </button>
                )}
                <button onClick={() => action(p.id, "delete")} disabled={actionId === p.id}
                  className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-slate-500 hover:text-rose-400 cursor-pointer" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={() => setShowEditor(false)}>
          <div className="bg-[#090c14] border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#090c14] border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-white text-base">{editingId ? "Edit Prompt Template" : "New Prompt Template"}</h3>
              <button onClick={() => setShowEditor(false)} className="text-slate-500 hover:text-white p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Executive Resume Writer System Prompt" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Prompt Type", key: "prompt_type", options: ["system","developer","task","persona","industry","output_format","policy","tool_use","guardrail"] },
                  { label: "Task Type", key: "task_type", options: ["general","resume","cover-letter","analyze","sales_assist","support_assist","research"] },
                  { label: "Segment", key: "segment", options: ["all","b2b","b2c"] },
                  { label: "Environment", key: "environment", options: ["development","staging","production"] },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">{label}</label>
                    <select value={(form as unknown as Record<string, string>)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500">
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief summary of prompt goal" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Prompt Content *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={10} placeholder="Write system prompt instructions here. Placeholders like {user_name} will be interpolated at runtime."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono resize-y focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Dynamic Variables (press Enter)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.variables.map(v => (
                    <span key={v} className="flex items-center gap-1.5 text-xs bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1 text-cyan-300 font-mono">
                      {`{${v}}`} <button onClick={() => removeVar(v)} className="hover:text-rose-400 cursor-pointer"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <input onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVar((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }}
                  placeholder="Type variable (e.g. user_name) and press Enter" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowEditor(false)} className="flex-1 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.content}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer">
                <Save size={14} /> {saving ? "Saving..." : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-[#090c14] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{preview.name}</h3>
                <p className="text-xs text-slate-400 font-mono">v{preview.version} · {preview.task_type} · {preview.publish_status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyPromptText(preview.content, "preview")} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors" title="Copy Content">
                  <Copy size={14} />
                </button>
                <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-white p-1 rounded-lg"><X size={18} /></button>
              </div>
            </div>
            <pre className="p-6 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/60">{preview.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
