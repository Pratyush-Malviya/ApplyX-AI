"use client";

import { Zap } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Zap size={22} className="text-yellow-400" /> Agent Profiles</h1>
        <p className="text-slate-500 text-sm mt-1">Manage AI agent personas for different workflow types</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Sales Assistant", role: "Lead qualification and deal closing", icon: "💼", status: "published" },
          { name: "Support Agent", role: "Customer support and issue resolution", icon: "🎧", status: "published" },
          { name: "Resume Expert", role: "ATS optimisation and resume tailoring", icon: "📄", status: "published" },
          { name: "Research Agent", role: "In-depth research and summarisation", icon: "🔬", status: "draft" },
          { name: "Proposal Writer", role: "Business proposals and RFP responses", icon: "✍️", status: "draft" },
          { name: "Onboarding Bot", role: "User onboarding and feature education", icon: "🚀", status: "draft" },
        ].map((agent) => (
          <div key={agent.name} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700 transition-colors cursor-pointer group">
            <div className="text-3xl mb-3">{agent.icon}</div>
            <div className="font-semibold text-white text-sm mb-1">{agent.name}</div>
            <div className="text-xs text-slate-500 mb-3">{agent.role}</div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${agent.status === "published" ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40" : "bg-amber-600/20 text-amber-400 border-amber-500/40"}`}>{agent.status}</span>
              <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Configure →</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-5 bg-slate-900/40 border border-slate-800/40 border-dashed rounded-xl text-center text-slate-600">
        <p className="text-sm">Full agent profile CRUD editor — connect to <code className="text-slate-500">/api/admin/agent-profiles</code></p>
      </div>
    </div>
  );
}
