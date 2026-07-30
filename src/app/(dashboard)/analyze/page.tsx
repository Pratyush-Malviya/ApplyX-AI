"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

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
    const prompt = `Analyze this job posting and provide structured insights:\n\n${description}\n\nReturn a JSON-like analysis with:\n1. **Key Requirements** - Must-have skills, experience, qualifications\n2. **Nice-to-Haves** - Preferred skills and qualifications\n3. **Role Level** - Junior, Mid, Senior, Lead\n4. **Tech Stack** - Technologies, tools, frameworks mentioned\n5. **Soft Skills** - Valued personal qualities\n6. **ATS Keywords** - Top 10 keywords to include in a resume\n7. **Company Insights** - Company size, industry, culture clues\n8. **Match Score Tips** - What to emphasize if applying\n\nFormat clearly with bullet points and sections.`;
    try {
      const res = await fetch("/api/groq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAnalysis(data.content);
    } catch { setError("Failed to analyze. Check your GROQ_API_KEY."); }
    setAnalyzing(false);
  };

  if (pageLoading || supabaseLoading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (!client) return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2><p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-gray-900">{t("analyze.title")}</h1><p className="text-gray-500 mt-1">{t("analyze.subtitle")}</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="font-semibold text-gray-900">{t("coverLetters.jobDetails")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("analyze.jobUrl")}</label>
              <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="https://linkedin.com/jobs/..." />
            </div>
            <div className="text-center text-sm text-gray-400">— or —</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("analyze.jobDescription")}</label>
              <textarea value={jobText} onChange={(e) => setJobText(e.target.value)} rows={12} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium" placeholder="Paste the full job description here..." />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={analyzeJob} disabled={analyzing}
              className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium">
              {analyzing ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{t("analyze.analyzing")}</span> : t("analyze.analyzeBtn")}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold text-gray-900 mb-4">{t("analyze.results")}</h2>
            {analysis ? (
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed max-h-[600px] overflow-y-auto">{analysis}</div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p>{t("analyze.placeholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}