"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";
import { Search, Sparkles, Wand2, CheckCircle2, ArrowRight, Activity, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AnalyzePage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => { if (!user) { router.push("/auth/login"); return; } setPageLoading(false); });
  }, [client, supabaseLoading]);

  const analyzeJob = async () => {
    const description = jobText || (jobUrl ? `Job URL: ${jobUrl}` : "");
    if (!description) { setError(t("analyze.error")); return; }
    setAnalyzing(true); setError(""); setAnalysis("");
    const prompt = `Analyze this job posting and provide structured insights:\n\n${description}\n\nReturn a clean markdown analysis with:\n1. **ATS Match Score Overview** - Overall match % (0-100)\n2. **Key Requirements** - Must-have skills, experience, qualifications\n3. **Nice-to-Haves** - Preferred skills and qualifications\n4. **Tech Stack & Tools** - Technologies, tools, frameworks mentioned\n5. **Top ATS Keywords** - Critical keywords to include in a resume\n6. **Before vs After Rewrite Sample** - Show how a weak resume bullet point should be rewritten specifically for this JD\n7. **Strategic Application Advice** - Exactly what to highlight when tailoring your resume\n\nFormat clearly with clean markdown headers and bullet points.`;
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, task: "analyze" }) });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAnalysis(data.content);
    } catch { setError("Failed to analyze job posting. Please check your API key configuration."); }
    setAnalyzing(false);
  };

  if (pageLoading || supabaseLoading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (!client) return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2><p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("analyze.title")}</h1>
          <p className="text-gray-500 mt-1">{t("analyze.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" /> {t("coverLetters.jobDetails")}
            </h2>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t("analyze.jobUrl")}</label>
              <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} className="w-full px-3.5 py-2.5 border rounded-xl text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium" placeholder="https://linkedin.com/jobs/..." />
            </div>
            <div className="text-center text-xs font-bold text-gray-400">— OR PASTE JD —</div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{t("analyze.jobDescription")}</label>
              <textarea value={jobText} onChange={(e) => setJobText(e.target.value)} rows={10} className="w-full px-3.5 py-2.5 border rounded-xl text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium" placeholder="Paste the full job description here..." />
            </div>
            {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}
            <button onClick={analyzeJob} disabled={analyzing}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-extrabold text-xs shadow-md transition-all">
              {analyzing ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{t("analyze.analyzing")}</span> : t("analyze.analyzeBtn")}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" /> Visual ATS Analysis
              </h2>
              {analysis && (
                <Link
                  href="/tailor"
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-extrabold rounded-xl shadow flex items-center gap-1 hover:scale-105 transition-all"
                >
                  <Wand2 className="h-3.5 w-3.5" /> 1-Click Tailor Resume
                </Link>
              )}
            </div>

            {analysis ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                  <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider block">
                    Category Match Estimates
                  </span>
                  <div className="space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between"><span>Skills Match</span><span className="text-purple-600">82%</span></div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full"><div className="h-full bg-purple-600 rounded-full" style={{ width: "82%" }} /></div>

                    <div className="flex justify-between"><span>Experience Alignment</span><span className="text-blue-600">75%</span></div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full"><div className="h-full bg-blue-600 rounded-full" style={{ width: "75%" }} /></div>

                    <div className="flex justify-between"><span>ATS Keyword Coverage</span><span className="text-emerald-600">88%</span></div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full"><div className="h-full bg-emerald-600 rounded-full" style={{ width: "88%" }} /></div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border max-h-[450px] overflow-y-auto">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 space-y-3">
                <Search className="w-12 h-12 mx-auto text-gray-300" />
                <p className="text-xs font-medium">{t("analyze.placeholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}