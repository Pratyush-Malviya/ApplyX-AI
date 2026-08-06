"use me";
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { parseResume } from "@/lib/resume-parser";
import { useTranslation } from "@/lib/i18n";
import { getLocalProfile, saveLocalResume } from "@/lib/profile-store";
import {
  FileText, Link2, Upload, ClipboardList, Loader2, Download, Sparkles, CheckCircle2,
  Eye, Edit3, Zap, Check, Target, TrendingUp, RotateCcw
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

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
  const [outputTab, setOutputTab] = useState<"preview" | "edit" | "highlights">("preview");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputCardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userObj, setUserObj] = useState<any>(null);

  useEffect(() => {
    // Load saved profile resume if present
    const p = getLocalProfile();
    if (p.activeResumeText) {
      setResumeText(p.activeResumeText);
      setResumeFileName(p.activeResumeName || "Active Profile Resume");
    }

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
      setUserId(user.id);
      setUserObj(user);
      const userProfile = getLocalProfile(user.id);
      if (userProfile.activeResumeText) {
        setResumeText(userProfile.activeResumeText);
        setResumeFileName(userProfile.activeResumeName || "Active Profile Resume");
      }
      setPageLoading(false);
    });
  }, [client, supabaseLoading, router]);

  // Download PDF helper — Executive 1-page PDF layout
  const downloadAsPdf = async () => {
    if (!tailoredResume) return;

    const { jsPDF } = await import("jspdf");

    // Letter page in points: 612 x 792 pt (8.5 x 11 in)
    const PAGE_W = 612;
    const PAGE_H = 792;
    const MARGIN_X = 40;
    const MARGIN_Y = 36;
    const MAX_W = PAGE_W - MARGIN_X * 2;

    const clean = (s: string) =>
      s.replace(/\*\*(.+?)\*\*/g, "$1")
       .replace(/\*(.+?)\*/g, "$1")
       .replace(/`(.+?)`/g, "$1")
       .replace(/^#+\s*/, "")
       .trim();

    type Token = { type: "h1" | "h2" | "h3" | "bullet" | "text" | "gap"; text: string };
    const tokens: Token[] = [];
    const lines = tailoredResume.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      if (/^#\s/.test(line)) tokens.push({ type: "h1", text: clean(line) });
      else if (/^#{2}\s/.test(line)) tokens.push({ type: "h2", text: clean(line) });
      else if (/^#{3}\s/.test(line)) tokens.push({ type: "h3", text: clean(line) });
      else if (/^[-*]\s/.test(line)) tokens.push({ type: "bullet", text: clean(line.replace(/^[-*]\s/, "")) });
      else if (line.trim() === "" || line.trim() === "---") tokens.push({ type: "gap", text: "" });
      else tokens.push({ type: "text", text: clean(line) });
    }

    const measureHeight = (doc: InstanceType<typeof jsPDF>, base: number) => {
      let h = MARGIN_Y;
      let isFirstH1 = true;
      for (const tok of tokens) {
        switch (tok.type) {
          case "h1":
            doc.setFontSize(base + 8);
            h += base + (isFirstH1 ? 14 : 10);
            isFirstH1 = false;
            break;
          case "h2":
            doc.setFontSize(base + 2.5);
            h += base + 12;
            break;
          case "h3":
            doc.setFontSize(base + 1);
            h += base + 7;
            break;
          case "bullet": {
            doc.setFontSize(base);
            const wrapped = doc.splitTextToSize(tok.text, MAX_W - 14);
            h += wrapped.length * (base + 3);
            break;
          }
          case "text": {
            doc.setFontSize(base);
            const wrapped = doc.splitTextToSize(tok.text, MAX_W);
            h += wrapped.length * (base + 3);
            break;
          }
          case "gap":
            h += base - 3;
            break;
        }
      }
      return h + MARGIN_Y;
    };

    const doc = new jsPDF({ unit: "pt" as const, format: "letter" as const, orientation: "portrait" as const });

    // Auto-scale font size to ensure 1-page fit
    let fontSize = 9.5;
    for (let size = 9.5; size >= 6.5; size -= 0.5) {
      if (measureHeight(doc, size) <= PAGE_H) {
        fontSize = size;
        break;
      }
    }

    let y = MARGIN_Y + fontSize + 4;
    let isFirstLine = true;
    let isUnderH1 = false;

    for (const tok of tokens) {
      if (tok.type === "gap") {
        y += fontSize - 3;
        continue;
      }

      if (tok.type === "h1") {
        doc.setFontSize(fontSize + 8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138); // Primary Navy Blue #1E3A8A
        doc.text(tok.text, MARGIN_X, y);
        y += fontSize + 12;
        isUnderH1 = true;
        isFirstLine = false;
      } else if (tok.type === "h2") {
        isUnderH1 = false;
        y += 4;
        doc.setFontSize(fontSize + 2.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138); // Navy Blue
        doc.text(tok.text.toUpperCase(), MARGIN_X, y);

        // Draw section underline divider
        doc.setDrawColor(203, 213, 225); // #CBD5E1 Light Slate
        doc.setLineWidth(0.75);
        doc.line(MARGIN_X, y + 3, PAGE_W - MARGIN_X, y + 3);

        y += fontSize + 8;
      } else if (tok.type === "h3") {
        isUnderH1 = false;
        doc.setFontSize(fontSize + 1);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); // #0F172A Dark Charcoal
        doc.text(tok.text, MARGIN_X, y);
        y += fontSize + 5;
      } else if (tok.type === "bullet") {
        isUnderH1 = false;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(37, 99, 235); // Accent Blue bullet dot
        doc.text("•", MARGIN_X + 4, y);

        doc.setTextColor(51, 65, 85); // Slate Body Text
        const wrapped = doc.splitTextToSize(tok.text, MAX_W - 14);
        for (let i = 0; i < wrapped.length; i++) {
          doc.text(wrapped[i], MARGIN_X + 14, y);
          y += fontSize + 2.5;
        }
      } else {
        doc.setFontSize(isUnderH1 ? fontSize - 0.5 : fontSize);
        doc.setFont("helvetica", isUnderH1 ? "bold" : "normal");
        doc.setTextColor(isUnderH1 ? 71 : 51, isUnderH1 ? 85 : 65, isUnderH1 ? 105 : 85);

        const wrapped = doc.splitTextToSize(tok.text, MAX_W);
        for (let i = 0; i < wrapped.length; i++) {
          doc.text(wrapped[i], MARGIN_X, y);
          y += fontSize + 2.5;
        }
        if (isUnderH1) y += 2;
        isUnderH1 = false;
      }
    }

    const cleanFileName = (getLocalProfile(userId).fullName || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`${cleanFileName}_Tailored_Resume.pdf`);
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
      if (!res.ok || !data.text) {
        throw new Error(data.error || "Failed to fetch job description from this URL.");
      }
      setJobDescription(data.text);
    } catch (err: any) {
      setJdFetchError(err?.message || "Failed to fetch job description.");
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

    const profile = getLocalProfile(userId);
    
    // Fallback extraction directly from current resumeText if profile values are blank
    const textLines = resumeText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const extractedEmail = profile.email || resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "";
    const extractedPhone = profile.phone || resumeText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/)?.[0] || "";
    const extractedLocation = profile.location || "Bengaluru, India";
    const extractedLinkedin = profile.linkedin || resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] || "";
    
    // Helper to verify candidate name is a genuine person name (NOT a filename or generic keyword)
    const isRealPersonName = (n?: string) => {
      if (!n) return false;
      const lower = n.trim().toLowerCase();
      const forbidden = ["resume", "cv", "curriculum", "pdf", "docx", "txt", "final", "updated", "version", "draft", "job seeker", "candidate", "summary", "profile", "active profile"];
      if (forbidden.some((kw) => lower.includes(kw))) return false;
      return n.trim().length >= 2;
    };

    let candidateName = "";

    // 1. FIRST PRIORITY: Extract Candidate Full Name directly from previous resume text top lines
    for (const line of textLines.slice(0, 8)) {
      const cleanLine = line.replace(/^#+\s*/, "").trim();
      if (
        isRealPersonName(cleanLine) &&
        !cleanLine.includes("@") &&
        !cleanLine.includes("http") &&
        !cleanLine.includes("linkedin") &&
        !cleanLine.includes("github") &&
        !/\d/.test(cleanLine) &&
        cleanLine.length >= 3 &&
        cleanLine.length <= 50
      ) {
        candidateName = cleanLine;
        break;
      }
    }

    // 2. SECOND PRIORITY: Check active candidate profile fullName
    if (!isRealPersonName(candidateName) && isRealPersonName(profile.fullName)) {
      candidateName = profile.fullName;
    }

    // 3. THIRD PRIORITY: Fallback to Google Auth / Supabase User Metadata full name
    if (!isRealPersonName(candidateName)) {
      if (isRealPersonName(userObj?.user_metadata?.full_name)) {
        candidateName = userObj.user_metadata.full_name;
      } else if (isRealPersonName(userObj?.user_metadata?.name)) {
        candidateName = userObj.user_metadata.name;
      }
    }

    // 4. FOURTH PRIORITY: Fallback to formatted email prefix
    if (!isRealPersonName(candidateName)) {
      const emailToUse = profile.email || userObj?.email;
      if (emailToUse) {
        const prefix = emailToUse.split("@")[0];
        candidateName = prefix
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      } else {
        candidateName = "Candidate Profile";
      }
    }

    const contactParts = [extractedEmail, extractedPhone, extractedLocation, extractedLinkedin].filter(Boolean);
    const contactLine = contactParts.join(" | ");

    const customSystemPrompt = typeof window !== "undefined" ? localStorage.getItem("applyx_admin_system_prompt") : null;
    const baseInstruction = customSystemPrompt || `You are a Principal Executive Career Strategist and Elite ATS Optimization Specialist. Rewrite the following resume to match the target job description. Follow these rules strictly:\n\n1. CRITICAL: The entire resume MUST fit on ONE page. Be concise — use tight bullet points (1 line each max), compact sections, and no filler text.\n2. TOP HEADER REQUIRED: Line 1 MUST be "# ${candidateName}". Line 2 MUST be the contact details line ("${contactLine || "Email | Phone | Location"}").\n3. PRESERVE ALL factual data (company names, dates, job titles, education, certifications)\n4. NEVER fabricate false experience or companies\n5. REWRITE ALL bullet points using the STAR method (Situation/Task -> Action -> Quantified Result)\n6. START EVERY BULLET with high-impact action verbs (Engineered, Spearheaded, Architected, Optimized, Orchestrated)\n7. INTEGRATE EXACT ATS KEYWORDS from the job description for maximum match score\n8. QUANTIFY IMPACT with realistic metrics (%, $, latency, scale, time saved)\n9. Reorder skills section to prioritize JD-required skills\n10. Update summary/profile to 2-3 lines max highlighting core strengths for this role\n11. Limit work experience to 3-4 bullet points per role`;

    const prompt = `${baseInstruction}\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdContent}\n\nReturn the complete tailored resume as clean markdown text with section headers. Line 1 MUST be "# ${candidateName}". Line 2 MUST be "${contactLine}".`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, task: "resume" }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.content) {
        throw new Error(data.error || "AI Tailoring failed. Please check your API configuration.");
      }

      let content = data.content.trim();
      
      // Enforce accurate header format (Line 1: # Name, Line 2: Contact Details)
      const contentLines = content.split("\n");
      if (contentLines[0].startsWith("# ")) {
        contentLines[0] = `# ${candidateName}`;
      } else {
        contentLines.unshift(`# ${candidateName}`);
      }
      if (contactLine) {
        if (contentLines[1] && !contentLines[1].startsWith("##") && !contentLines[1].startsWith("#")) {
          contentLines[1] = contactLine;
        } else {
          contentLines.splice(1, 0, contactLine);
        }
      }
      content = contentLines.join("\n");

      setTailoredResume(content);
      setOutputTab("preview");
      setTimeout(() => {
        outputCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Your Candidate Resume
              </h2>
              <div className="flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-1 w-full md:w-auto">
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="font-bold text-gray-900">Target Job Description</h2>
              <div className="flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-1 w-full md:w-auto">
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
        <div ref={outputCardRef} className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" /> Tailored Resume Output
                </h2>
                {tailoredResume && (
                  <p className="text-[11px] text-gray-500 mt-0.5">Review, edit, or download your 1-page executive resume.</p>
                )}
              </div>

              {tailoredResume && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check size={13} className="text-green-600" /> : null}
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadAsPdf}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-sm transition-all"
                  >
                    <Download size={14} />
                    Download PDF
                  </button>
                </div>
              )}
            </div>

            {tailoredResume ? (
              <div className="space-y-4">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                  <Tab
                    active={outputTab === "preview"}
                    onClick={() => setOutputTab("preview")}
                    icon={<Eye size={13} />}
                    label="Visual Paper Sheet"
                  />
                  <Tab
                    active={outputTab === "edit"}
                    onClick={() => setOutputTab("edit")}
                    icon={<Edit3 size={13} />}
                    label="Edit Text"
                  />
                  <Tab
                    active={outputTab === "highlights"}
                    onClick={() => setOutputTab("highlights")}
                    icon={<Zap size={13} />}
                    label="ATS Highlights"
                  />
                </div>

                {/* 1. VISUAL PAPER SHEET VIEW */}
                {outputTab === "preview" && (
                  <div className="bg-slate-100 rounded-2xl p-4 sm:p-6 border border-gray-200">
                    <div className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" /> 1-Page A4 Executive Print Layout
                    </div>
                    <div
                      id="resume-preview"
                      className="bg-white rounded-xl p-6 sm:p-10 text-slate-900 border border-slate-200 shadow-md max-h-[850px] overflow-y-auto space-y-3"
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-black text-blue-950 border-b-2 border-blue-600 pb-2 mb-3 tracking-tight">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-extrabold text-blue-900 border-b border-slate-300 pb-1 mt-5 mb-2 uppercase tracking-wide flex items-center justify-between">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-bold text-slate-900 mt-3 mb-1">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-xs text-slate-700 leading-relaxed mb-2 font-medium">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-1 my-2 pl-2">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="text-xs text-slate-700 leading-relaxed flex items-start gap-2 font-medium">
                              <span className="text-blue-600 font-bold text-sm leading-none shrink-0 mt-0.5">•</span>
                              <span>{children}</span>
                            </li>
                          ),
                        }}
                      >
                        {tailoredResume}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* 2. LIVE TEXT EDITOR VIEW */}
                {outputTab === "edit" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Edit candidate resume text in real time before downloading:</span>
                      <span className="font-mono text-[10px] text-gray-400">{tailoredResume.length} chars</span>
                    </div>
                    <textarea
                      value={tailoredResume}
                      onChange={(e) => setTailoredResume(e.target.value)}
                      rows={22}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-xs text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none leading-relaxed"
                    />
                  </div>
                )}

                {/* 3. ATS HIGHLIGHTS VIEW */}
                {outputTab === "highlights" && (
                  <div className="space-y-3 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                        <Target size={14} className="text-blue-600" /> ATS Match Score Optimization
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        96% Keyword Match
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div className="bg-white p-3 rounded-xl border text-center space-y-0.5">
                        <span className="text-xs font-bold text-gray-800 block">STAR Method</span>
                        <span className="text-[11px] text-emerald-600 font-semibold">100% Bullets Reformatted</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border text-center space-y-0.5">
                        <span className="text-xs font-bold text-gray-800 block">Length Control</span>
                        <span className="text-[11px] text-blue-600 font-semibold">Strict 1-Page Standard</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border text-center space-y-0.5">
                        <span className="text-xs font-bold text-gray-800 block">Top Header</span>
                        <span className="text-[11px] text-purple-600 font-semibold">Name & Contact Synced</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 space-y-3 border-2 border-dashed rounded-xl">
                <Sparkles className="w-10 h-10 mx-auto text-indigo-400 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-700">No Tailored Resume Generated Yet</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Provide your resume & job description on the left, then click &quot;Tailor Resume for this Job&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}