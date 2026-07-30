"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

import { getLocalProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export default function CoverLettersPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    const p = getLocalProfile();
    if (p.activeResumeText) {
      setResumeText(p.activeResumeText);
    }
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => { if (!user) { router.push("/auth/login"); return; } setPageLoading(false); });
  }, [client, supabaseLoading]);

  const generateCoverLetter = async () => {
    if (!jobDescription) { setError(t("coverLetters.error")); return; }
    setGenerating(true); setError(""); setCoverLetter("");
    const prompt = `Generate a professional, personalized cover letter for the following job. Use the provided resume context to tailor it.\n\nJob Title: ${jobTitle || "the position"}\nCompany: ${companyName || "the company"}\n\nJob Description:\n${jobDescription}\n\n${resumeText ? `Resume Context:\n${resumeText}` : ""}\n\nWrite a compelling cover letter that:\n1. Opens with a strong hook related to the role\n2. Connects the candidate's experience to the job requirements\n3. Uses specific keywords from the job description\n4. Ends with a confident call to action\n5. Is 250-350 words long\n6. Uses a professional but natural tone\n7. Is ready to copy and paste (no placeholders)\n\nFormat as plain text.`;
    try {
      const res = await fetch("/api/groq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setCoverLetter(data.content);
    } catch { setError("Failed to generate cover letter. Check your GROQ_API_KEY."); }
    setGenerating(false);
  };

  if (pageLoading || supabaseLoading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (!client) return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2><p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-gray-900">{t("coverLetters.title")}</h1><p className="text-gray-500 mt-1">{t("coverLetters.subtitle")}</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="font-semibold text-gray-900">{t("coverLetters.jobDetails")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("coverLetters.jobTitle")}</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("coverLetters.companyName")}</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="e.g. Google" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("coverLetters.jobDescription")}</label>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium" placeholder="Paste the job description here..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("coverLetters.yourResume")}</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium" placeholder="Paste your resume text here to get a more tailored cover letter..." />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={generateCoverLetter} disabled={generating}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
              {generating ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{t("coverLetters.generating")}</span> : t("coverLetters.generateBtn")}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t("coverLetters.generatedLetter")}</h2>
              {coverLetter && <button onClick={async () => { await navigator.clipboard.writeText(coverLetter); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 font-medium">{copied ? t("coverLetters.copied") : t("coverLetters.copy")}</button>}
            </div>
            {coverLetter ? (
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{coverLetter}</div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <p>{t("coverLetters.placeholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}