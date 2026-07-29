"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function TailorPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => { if (!user) { router.push("/auth/login"); return; } setPageLoading(false); });
  }, [client, supabaseLoading]);

  const tailorResume = async () => {
    if (!resumeText || !jobDescription) { setError(t("tailor.error")); return; }
    setGenerating(true); setError(""); setTailoredResume("");
    const prompt = `You are an expert ATS optimization specialist. Rewrite the following resume to match the job description. Follow these rules strictly:\n\n1. PRESERVE ALL factual data (company names, dates, job titles, education, certifications)\n2. NEVER fabricate technologies, experience, or years\n3. Rewrite experience bullets to incorporate keywords from the job description naturally\n4. Use exact terminology from the job description for ATS matching\n5. Reorder skills section to prioritize JD-required skills\n6. Update the summary/profile to highlight strengths most relevant to the role\n7. Remove or minimize irrelevant content\n8. Keep the same section structure\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nReturn the complete tailored resume as plain text.`;
    try {
      const res = await fetch("/api/groq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setTailoredResume(data.content);
    } catch { setError("Failed to tailor resume. Check your GROQ_API_KEY."); }
    setGenerating(false);
  };

  const copyToClipboard = async () => { await navigator.clipboard.writeText(tailoredResume); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (pageLoading || supabaseLoading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (!client) return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2><p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p></div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div><h1 className="text-2xl font-bold text-gray-900">{t("tailor.title")}</h1><p className="text-gray-500 mt-1">{t("tailor.subtitle")}</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="font-semibold text-gray-900">{t("tailor.yourResume")}</h2>
            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={10}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" placeholder="Paste your resume text here..." />
            <h2 className="font-semibold text-gray-900">{t("tailor.jobDescription")}</h2>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Paste the job description you want to tailor for..." />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={tailorResume} disabled={generating}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {generating ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{t("tailor.tailoring")}</span> : t("tailor.tailorBtn")}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t("tailor.tailoredResume")}</h2>
              {tailoredResume && <button onClick={copyToClipboard} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 font-medium">{copied ? t("tailor.copied") : t("tailor.copy")}</button>}
            </div>
            {tailoredResume ? (
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed max-h-[600px] overflow-y-auto">{tailoredResume}</div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p>{t("tailor.placeholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}