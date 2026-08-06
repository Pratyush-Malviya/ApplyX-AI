"use client";

import { useState } from "react";
import { DollarSign, Sparkles, Send, RefreshCw, Award, ArrowRight, ShieldCheck, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function SalaryCopilotPage() {
  const [offerText, setOfferText] = useState(
    "Offer Role: Senior Full Stack Engineer\nFixed Salary: ₹28 LPA\nPerformance Bonus: ₹4 LPA\nESOPs: $15,000 vested over 4 years\nJoining Bonus: ₹2 LPA"
  );
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyzeSalary = async () => {
    if (!offerText.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze the following compensation offer details for the Indian market:\n\n${offerText}\n\nProvide evaluation against market benchmarks, fixed vs variable split analysis, counter-offer negotiation strategy, and a ready-to-send counter-offer email script.`,
          task: "salary-copilot",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze offer");

      setAnalysis(data);
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
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-2">
            New Feature — Indian CTC Compensation Assistant
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-emerald-600" /> Salary Negotiation Copilot
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Analyze offer letters, evaluate Fixed vs Variable vs ESOP CTC splits, and generate counter-offer scripts.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Input Box */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            Paste Offer Letter Details or Compensation Package
          </label>
          <span className="text-[11px] text-gray-400 font-medium">In-memory processing — PII scrubbed</span>
        </div>

        <textarea
          value={offerText}
          onChange={(e) => setOfferText(e.target.value)}
          className="w-full min-h-[160px] p-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Paste compensation details (e.g. Fixed CTC, Variable, Stocks, Notice Period buyout)..."
        />

        <div className="flex justify-end">
          <button
            onClick={handleAnalyzeSalary}
            disabled={loading || !offerText.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> AI Analyzing Compensation Structure...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Analyze Offer & Generate Counter Script
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output */}
      {analysis && (
        <div className="bg-white p-6 rounded-2xl border shadow-lg space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Salary Evaluation & Strategy</h3>
                <p className="text-xs text-gray-500">
                  Evaluated via {analysis.displayName || "Google Gemini 2.5 Pro"} ({analysis.latencyMs}ms)
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border">
            <ReactMarkdown>{analysis.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
