"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before_data: unknown;
  after_data: unknown;
  actor_email: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40",
  update: "bg-blue-600/20 text-blue-400 border-blue-500/40",
  delete: "bg-rose-600/20 text-rose-400 border-rose-500/40",
  publish: "bg-violet-600/20 text-violet-400 border-violet-500/40",
  rollback: "bg-amber-600/20 text-amber-400 border-amber-500/40",
  cache_purge: "bg-cyan-600/20 text-cyan-400 border-cyan-500/40",
  test_run: "bg-slate-700/50 text-slate-400 border-slate-600",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (entityType !== "all") params.set("entity_type", entityType);
      if (action !== "all") params.set("action", action);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const json = await res.json();
      if (res.ok) { setLogs(json.data ?? []); setTotal(json.total ?? 0); }
    } catch {}
    setLoading(false);
  }, [page, entityType, action]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ScrollText size={22} className="text-slate-400" /> Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Immutable record of all admin actions · {total} entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-slate-500" />
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">All Entities</option>
          {["ai_prompt_templates","ai_model_routes","ai_generation_policies","profiles","subscriptions","payment_transactions","cache"].map(e =>
            <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
          )}
        </select>
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">All Actions</option>
          {["create","update","delete","publish","rollback","cache_purge","test_run"].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Logs */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-8 bg-slate-800 rounded animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500"><ScrollText size={28} className="mx-auto mb-2 opacity-30" /><p>No audit logs yet.</p></div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ACTION_COLORS[log.action] ?? ""}`}>{log.action}</span>
                  <span className="text-xs text-slate-400 font-medium">{log.entity_type?.replace(/_/g, " ")}</span>
                  {log.entity_id && <span className="text-[11px] text-slate-600 font-mono">{log.entity_id.slice(0, 8)}…</span>}
                  <span className="text-xs text-slate-600">by {log.actor_email ?? "system"}</span>
                  <span className="ml-auto text-[11px] text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
                  {Boolean(log.before_data || log.after_data) && (
                    <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="text-[11px] text-slate-600 hover:text-slate-400">
                      {expanded === log.id ? "Hide diff" : "View diff"}
                    </button>
                  )}
                </div>
                {expanded === log.id && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Boolean(log.before_data) && (
                      <div>
                        <div className="text-[10px] text-rose-400 font-semibold mb-1">Before</div>
                        <pre className="text-[10px] text-slate-500 bg-slate-900 rounded-lg p-2 overflow-auto max-h-40 font-mono">{JSON.stringify(log.before_data, null, 2)}</pre>
                      </div>
                    )}
                    {Boolean(log.after_data) && (
                      <div>
                        <div className="text-[10px] text-emerald-400 font-semibold mb-1">After</div>
                        <pre className="text-[10px] text-slate-400 bg-slate-900 rounded-lg p-2 overflow-auto max-h-40 font-mono">{JSON.stringify(log.after_data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
    </div>
  );
}
