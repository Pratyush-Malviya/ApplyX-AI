"use client";

import { useState } from "react";
import { Bell, Plus, X, Save, AlertTriangle, Info, CheckCircle } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = { info: Info, warning: AlertTriangle, success: CheckCircle, error: AlertTriangle };
const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-600/20 text-blue-400 border-blue-500/40",
  warning: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  success: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
  error: "bg-rose-600/20 text-rose-400 border-rose-500/40",
  maintenance: "bg-slate-700/50 text-slate-400 border-slate-600",
};

export default function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", target: "all", cta_label: "", cta_url: "", enabled: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) setShowCreate(false);
    } catch {} finally { setSaving(false); }
  };

  const mockAnnouncements = [
    { id: "1", title: "Gemini 2.5 Pro Now Default", message: "We upgraded to Gemini 2.5 Pro for all resume tailoring tasks.", type: "success", target: "all", enabled: true },
    { id: "2", title: "Scheduled Maintenance", message: "The AI service will be offline for 30 minutes on Sunday at 2 AM IST.", type: "maintenance", target: "users", enabled: true },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell size={22} className="text-indigo-400" /> Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">Push banners and alerts to users or specific segments</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors">
          <Plus size={15} /> New Announcement
        </button>
      </div>

      <div className="space-y-3">
        {mockAnnouncements.map((a) => {
          const Icon = TYPE_ICONS[a.type] ?? Info;
          return (
            <div key={a.id} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[a.type]}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{a.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[a.type]}`}>{a.type}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">→ {a.target}</span>
                  </div>
                  <p className="text-xs text-slate-500">{a.message}</p>
                </div>
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${a.enabled ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40" : "bg-slate-700/50 text-slate-400 border-slate-600"}`}>
                  {a.enabled ? "live" : "off"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0d0f14] border border-slate-700 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">New Announcement</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs text-slate-400 font-medium mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
              <div><label className="block text-xs text-slate-400 font-medium mb-1">Message *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 font-medium mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    {["info","warning","success","error","maintenance"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></div>
                <div><label className="block text-xs text-slate-400 font-medium mb-1">Audience</label>
                  <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                    {["all","users","admins","free","pro","enterprise"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs text-slate-400 font-medium mb-1">CTA Label (optional)</label>
                <input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} placeholder="e.g. Learn More" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
              <div><label className="block text-xs text-slate-400 font-medium mb-1">CTA URL (optional)</label>
                <input value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300">Cancel</button>
              <button onClick={save} disabled={saving || !form.title || !form.message} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
                <Save size={14} /> {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
