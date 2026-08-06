"use client";

import { useState } from "react";
import { Building2, Sparkles, Search, RefreshCw, Award, ArrowRight, ShieldCheck, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function CompanyResearchPage() {
  const [companyName, setCompanyName] = useState("Swiggy");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleResearch = async () => {
    if (!companyName.trim()) return;

    setLoading(true);
    setReport(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Provide a detailed corporate intelligence briefing on target company '${companyName}'. Cover tech stack, culture & growth indicators, key interview focus areas, strategic pitch angle for candidates, and potential red flags.`,
          task: "company-research",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate company report");

      setReport(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 inline-block mb-2">
            New Feature — Company Intelligence Copilot
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-slate-800" /> Company Research Copilot
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Deep-dive corporate intel: tech stack, growth metrics, common interview questions & pitch strategy.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
          Target Company Name
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-slate-500 focus:outline-none"
            placeholder="e.g. Swiggy, Zomato, Razorpay, Atlassian"
          />
          <button
            onClick={handleResearch}
            disabled={loading || !companyName.trim()}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow flex items-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing Company Intel...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Generate Briefing Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Briefing Output */}
      {report && (
        <div className="bg-white p-6 rounded-2xl border shadow-lg space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Intelligence Report — {companyName}</h3>
                <p className="text-xs text-gray-500">
                  Generated via {report.displayName || "Google Gemini 2.5 Pro"} ({report.latencyMs}ms)
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border">
            <ReactMarkdown>{report.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
