"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { parseResume } from "@/lib/resume-parser";
import { useTranslation } from "@/lib/i18n";
import { FileText, Link2, Upload, ClipboardList, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

type ResumeMode = "paste" | "upload";
type JdMode = "paste" | "link";

export default function TailorPage() {
  const [pageLoading, setPageLoading] = useState(true);

  // Resume state
  const [resumeMode, setResumeMode] = useState<ResumeMode>("paste");
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeDragOver, setResumeDragOver] = useState(false);

  // JD state
  const [jdMode, setJdMode] = useState<JdMode>("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [fetchingJd, setFetchingJd] = useState(false);
  const [jdFetchError, setJdFetchError] = useState("");

  // Output state
  const [tailoredResume, setTailoredResume] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.push("/auth/login"); return; }
      setPageLoading(false);
    });
  }, [client, supabaseLoading]);

  // ── Resume file handling ────────────────────────────────────────────────
  const handleResumeFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|txt)$/i)) {
      alert("Please upload a PDF, DOCX, or TXT file");
      return;
    }
    setResumeParsing(true);
    setResumeFileName(file.name);
    try {
      const result = await parseResume(file);
      setResumeText(result.text);
    } catch {
      alert("Failed to parse resume. Please try again.");
    }
    setResumeParsing(false);
  }, []);

  const handleResumeDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setResumeDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleResumeFile(file);
    },
    [handleResumeFile]
  );

  const handleResumeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleResumeFile(file);
    },
    [handleResumeFile]
  );

  // ── JD from URL ─────────────────────────────────────────────────────────
  const fetchJobDescription = async () => {
    if (!jobUrl.trim()) return;
    setFetchingJd(true);
    setJdFetchError("");
    setJobDescription("");
    try {
      const res = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setJobDescription(data.text);
    } catch (err: any) {
      setJdFetchError(err.message || "Could not fetch job description. Try pasting it manually.");
    }
    setFetchingJd(false);
  };

  // ── Tailor ──────────────────────────────────────────────────────────────
  const tailorResume = async () => {
    const jdContent = jobDescription.trim();
    if (!resumeText || !jdContent) {
      setError(t("tailor.error"));
      return;
    }
    setGenerating(true);
    setError("");
    setTailoredResume("");

    const prompt = `You are an expert ATS optimization specialist. Rewrite the following resume to match the job description. Follow these rules strictly:\n\n1. PRESERVE ALL factual data (company names, dates, job titles, education, certifications)\n2. NEVER fabricate technologies, experience, or years\n3. Rewrite experience bullets to incorporate keywords from the job description naturally\n4. Use exact terminology from the job description for ATS matching\n5. Reorder skills section to prioritize JD-required skills\n6. Update the summary/profile to highlight strengths most relevant to the role\n7. Remove or minimize irrelevant content\n8. Keep the same section structure\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdContent}\n\nReturn the complete tailored resume as plain text.`;

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setTailoredResume(data.content);
    } catch {
      setError("Failed to tailor resume. Check your GROQ_API_KEY.");
    }
    setGenerating(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(tailoredResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (pageLoading || supabaseLoading)
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (!client)
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2>
        <p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p>
      </div>
    );

  // ── Tab toggle helper ───────────────────────────────────────────────────
  const Tab = ({
    active,
    onClick,
    icon,
    label,
  }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("tailor.title")}</h1>
        <p className="text-gray-500 mt-1">{t("tailor.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* ── Resume Card ── */}
          <div className="bg-white rounded-xl p-6 shadow-sm border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t("tailor.yourResume")}</h2>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Tab
                  active={resumeMode === "paste"}
                  onClick={() => setResumeMode("paste")}
                  icon={<ClipboardList size={13} />}
                  label="Paste Text"
                />
                <Tab
                  active={resumeMode === "upload"}
                  onClick={() => setResumeMode("upload")}
                  icon={<Upload size={13} />}
                  label="Choose Resume"
                />
              </div>
            </div>

            {resumeMode === "paste" ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder="Paste your resume text here..."
              />
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                onDragLeave={() => setResumeDragOver(false)}
                onDrop={handleResumeDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  resumeDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
                onClick={() => !resumeParsing && fileInputRef.current?.click()}
              >
                {resumeParsing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                    <p className="text-sm text-gray-500">Parsing resume…</p>
                  </div>
                ) : resumeText && resumeFileName ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-green-500" />
                    <p className="text-sm font-medium text-gray-700">{resumeFileName}</p>
                    <p className="text-xs text-gray-400">{resumeText.length.toLocaleString()} characters extracted</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setResumeText(""); setResumeFileName(""); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Replace file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Drop your resume here</p>
                    <p className="text-xs text-gray-400">PDF, DOCX, or TXT · click to browse</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleResumeInput}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* ── Job Description Card ── */}
          <div className="bg-white rounded-xl p-6 shadow-sm border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t("tailor.jobDescription")}</h2>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Tab
                  active={jdMode === "paste"}
                  onClick={() => setJdMode("paste")}
                  icon={<ClipboardList size={13} />}
                  label="Paste Text"
                />
                <Tab
                  active={jdMode === "link"}
                  onClick={() => { setJdMode("link"); setJdFetchError(""); }}
                  icon={<Link2 size={13} />}
                  label="Job Link"
                />
              </div>
            </div>

            {jdMode === "paste" ? (
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Paste the job description you want to tailor for..."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => { setJobUrl(e.target.value); setJdFetchError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && fetchJobDescription()}
                    placeholder="https://linkedin.com/jobs/view/... or any job URL"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={fetchJobDescription}
                    disabled={fetchingJd || !jobUrl.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {fetchingJd ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    {fetchingJd ? "Fetching…" : "Fetch JD"}
                  </button>
                </div>

                {jdFetchError && (
                  <p className="text-red-600 text-xs">{jdFetchError}</p>
                )}

                {jobDescription && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-green-600 font-medium">✓ Job description fetched</p>
                      <button
                        type="button"
                        onClick={() => setJobDescription("")}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {jobDescription.slice(0, 600)}{jobDescription.length > 600 ? "…" : ""}
                    </div>
                  </div>
                )}

                {!jobDescription && !fetchingJd && (
                  <p className="text-xs text-gray-400">
                    Paste a LinkedIn, Naukri, Indeed, or any job posting URL and click <strong>Fetch JD</strong>.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={tailorResume}
            disabled={generating}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t("tailor.tailoring")}
              </span>
            ) : (
              t("tailor.tailorBtn")
            )}
          </button>
        </div>

        {/* ── RIGHT COLUMN — Output ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t("tailor.tailoredResume")}</h2>
              {tailoredResume && (
                <button
                  onClick={copyToClipboard}
                  className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  {copied ? t("tailor.copied") : t("tailor.copy")}
                </button>
              )}
            </div>
            {tailoredResume ? (
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                {tailoredResume}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>{t("tailor.placeholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}