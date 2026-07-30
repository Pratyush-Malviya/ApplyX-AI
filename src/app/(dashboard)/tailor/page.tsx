"use me";
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { parseResume } from "@/lib/resume-parser";
import { useTranslation } from "@/lib/i18n";
import { getLocalProfile, saveLocalResume } from "@/lib/profile-store";
import { FileText, Link2, Upload, ClipboardList, Loader2, Download, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ResumeMode = "paste" | "upload" | "saved";
type JdMode = "paste" | "link";

export default function TailorPage() {
  const [pageLoading, setPageLoading] = useState(true);

  // Resume state
  const [resumeMode, setResumeMode] = useState<ResumeMode>("saved");
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
    // 1. Pre-load candidate active resume from profile
    const profile = getLocalProfile();
    if (profile.activeResumeText) {
      setResumeText(profile.activeResumeText);
      setResumeFileName(profile.activeResumeName || "Profile Resume");
      setResumeMode("saved");
    } else {
      setResumeMode("paste");
    }

    // 2. Pre-load job description passed from Web Job Finder (/jobs)
    const rawTargetJd = sessionStorage.getItem("applyx_target_jd");
    if (rawTargetJd) {
      try {
        const target = JSON.parse(rawTargetJd);
        if (target.description) {
          setJobDescription(target.description);
          setJdMode("paste");
        }
      } catch (err) {
        console.error("Failed to parse session target JD:", err);
      }
    }

    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.push("/auth/login"); return; }
      setPageLoading(false);
    });
  }, [client, supabaseLoading]);

  // Download PDF helper
  const downloadAsPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(tailoredResume, maxWidth);
    const lineHeight = 14;
    let y = margin;
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    doc.save("tailored-resume.pdf");
  };

  // Resume file handling
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
      saveLocalResume({
        fileName: file.name,
        fileType: file.type || "application/pdf",
        parsedText: result.text,
        parsedSections: result.sections,
      });
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

  // Fetch JD from URL
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

  // Tailor Resume via Unified AI Engine
  const tailorResume = async () => {
    const jdContent = jobDescription.trim();
    if (!resumeText || !jdContent) {
      setError("Please ensure both your resume text and target job description are provided.");
      return;
    }
    setGenerating(true);
    setError("");
    setTailoredResume("");

    const prompt = `You are a Principal Executive Career Strategist and Elite ATS Optimization Specialist. Rewrite the following resume to match the target job description. Follow these rules strictly:\n\n1. PRESERVE ALL factual data (company names, dates, job titles, education, certifications)\n2. NEVER fabricate false experience or companies\n3. REWRITE ALL bullet points using the STAR method (Situation/Task -> Action -> Quantified Result)\n4. START EVERY BULLET with high-impact action verbs (Engineered, Spearheaded, Architected, Optimized, Orchestrated)\n5. INTEGRATE EXACT ATS KEYWORDS from the job description for maximum match score\n6. QUANTIFY IMPACT with realistic metrics (%, $, latency, scale, time saved)\n7. Reorder skills section to prioritize JD-required skills\n8. Update summary/profile to highlight core strengths for this role\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdContent}\n\nReturn the complete tailored resume as clean markdown text with section headers.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.content) {
        throw new Error(data.error || "AI Tailoring failed. Please check your API configuration.");
      }
      setTailoredResume(data.content);
    } catch (err: any) {
      setError(err?.message || "Failed to tailor resume. Please check your AI API config.");
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
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">AI Resume Tailor & ATS Optimizer</h1>
        <p className="text-sm text-gray-500 mt-1">Tailor your candidate resume bullet points to match any job description in 1-click.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Resume Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Your Candidate Resume
              </h2>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Tab
                  active={resumeMode === "saved"}
                  onClick={() => setResumeMode("saved")}
                  icon={<CheckCircle2 size={13} />}
                  label="Saved Profile Resume"
                />
                <Tab
                  active={resumeMode === "upload"}
                  onClick={() => setResumeMode("upload")}
                  icon={<Upload size={13} />}
                  label="Upload File"
                />
                <Tab
                  active={resumeMode === "paste"}
                  onClick={() => setResumeMode("paste")}
                  icon={<ClipboardList size={13} />}
                  label="Paste Text"
                />
              </div>
            </div>

            {resumeMode === "saved" && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                {resumeFileName ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-900 block">{resumeFileName}</span>
                      <span className="text-[11px] text-blue-700 font-medium">Loaded from active candidate profile</span>
                    </div>
                    <Link href="/profile" className="text-xs font-bold text-blue-600 hover:underline">
                      Manage Profile →
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500">No active saved resume found in profile.</p>
                    <Link href="/resumes" className="text-xs font-bold text-blue-600 hover:underline mt-1 inline-block">
                      Upload to Profile →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {resumeMode === "paste" && (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono font-medium"
                placeholder="Paste your resume text here..."
              />
            )}

            {resumeMode === "upload" && (
              <div
                onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                onDragLeave={() => setResumeDragOver(false)}
                onDrop={handleResumeDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  resumeDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
                onClick={() => !resumeParsing && fileInputRef.current?.click()}
              >
                {resumeParsing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                    <p className="text-xs text-gray-500">Parsing & saving resume…</p>
                  </div>
                ) : resumeText && resumeFileName ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-green-500" />
                    <p className="text-xs font-bold text-gray-700">{resumeFileName}</p>
                    <p className="text-[10px] text-gray-400">{resumeText.length.toLocaleString()} characters extracted</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-xs font-bold text-gray-700">Drop your resume here</p>
                    <p className="text-[10px] text-gray-400">PDF, DOCX, or TXT</p>
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

          {/* Job Description Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Target Job Description</h2>
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
                  label="Job URL"
                />
              </div>
            </div>

            {jdMode === "paste" ? (
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans font-medium"
                placeholder="Paste target job description here or load from Web Jobs Finder..."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => { setJobUrl(e.target.value); setJdFetchError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && fetchJobDescription()}
                    placeholder="https://linkedin.com/jobs/view/... or any job link"
                    className="flex-1 px-3 py-2 border rounded-xl text-xs text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={fetchJobDescription}
                    disabled={fetchingJd || !jobUrl.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {fetchingJd ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    {fetchingJd ? "Fetching…" : "Fetch JD"}
                  </button>
                </div>

                {jdFetchError && <p className="text-red-600 text-xs">{jdFetchError}</p>}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}

          <button
            onClick={tailorResume}
            disabled={generating}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-md hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Gemini AI is Tailoring Your Resume...
              </span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Tailor Resume for this Job
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN — Output */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Tailored Resume Output</h2>
              {tailoredResume && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                  <button
                    onClick={downloadAsPdf}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                  >
                    <Download size={13} />
                    Download PDF
                  </button>
                </div>
              )}
            </div>

            {tailoredResume ? (
              <div className="bg-slate-950 rounded-xl p-4 text-slate-100 font-mono text-xs leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                {tailoredResume}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto text-indigo-400" />
                <p className="text-sm font-semibold text-gray-700">Click &quot;Tailor Resume for this Job&quot; to generate an ATS-optimized resume.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}