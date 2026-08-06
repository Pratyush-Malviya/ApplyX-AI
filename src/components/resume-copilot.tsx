"use client";

import { useState } from "react";
import { Sparkles, Check, Copy, Share2, RefreshCw, Eye, FileCode, CheckCircle2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ResumeCopilotProps {
  initialResumeText: string;
  jobDescription?: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  onRegenerateSection?: (sectionName: string) => Promise<void>;
  isGenerating?: boolean;
}

export function ResumeCopilot({
  initialResumeText,
  jobDescription = "",
  matchedKeywords = ["React", "TypeScript", "Next.js", "REST APIs"],
  missingKeywords = ["GraphQL", "Docker", "AWS", "CI/CD"],
  onRegenerateSection,
  isGenerating = false,
}: ResumeCopilotProps) {
  const [text, setText] = useState(initialResumeText);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [selectedHoverKeyword, setSelectedHoverKeyword] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    // Generate simulated secure share URL
    const token = Math.random().toString(36).substring(2, 10);
    const shareUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900">ApplyX Resume Copilot</h3>
            <p className="text-xs text-gray-500">Interactive ATS editor & real-time keyword alignment</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit / Preview Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Markdown Preview
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === "edit" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" /> Edit Raw Text
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 border hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            {shared ? "Link Copied!" : "Share Link"}
          </button>
        </div>
      </div>

      {/* ATS Keyword Alignment Cloud */}
      <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            Real-Time ATS Keyword Coverage
          </span>
          <span className="text-[11px] font-semibold text-gray-500">
            Matched: {matchedKeywords.length} | Missing: {missingKeywords.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {matchedKeywords.map((kw, i) => (
            <span
              key={i}
              onMouseEnter={() => setSelectedHoverKeyword(kw)}
              onMouseLeave={() => setSelectedHoverKeyword(null)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {kw}
            </span>
          ))}

          {missingKeywords.map((kw, i) => (
            <span
              key={i}
              onMouseEnter={() => setSelectedHoverKeyword(kw)}
              onMouseLeave={() => setSelectedHoverKeyword(null)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
            >
              <AlertCircle className="h-3 w-3 text-rose-600" /> {kw}
            </span>
          ))}
        </div>

        {selectedHoverKeyword && (
          <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border">
            💡 <strong>Copilot Insight for &quot;{selectedHoverKeyword}&quot;:</strong>{" "}
            {matchedKeywords.includes(selectedHoverKeyword)
              ? "Integrated into experience bullets with STAR quantifiable metrics."
              : "Keyword required by Target JD. Add to Skills or Experience section to boost ATS score."}
          </div>
        )}
      </div>

      {/* Section Regeneration Actions */}
      {onRegenerateSection && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Regenerate Section:</span>
          {["Professional Summary", "Work Experience", "Technical Skills"].map((sec) => (
            <button
              key={sec}
              disabled={isGenerating}
              onClick={() => onRegenerateSection(sec)}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 text-violet-600 ${isGenerating ? "animate-spin" : ""}`} /> {sec}
            </button>
          ))}
        </div>
      )}

      {/* Editor / Preview Body */}
      {activeTab === "preview" ? (
        <div className="prose prose-slate max-w-none p-6 rounded-xl border bg-slate-50/50 min-h-[400px] overflow-y-auto text-sm leading-relaxed">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[400px] p-4 rounded-xl border font-mono text-xs bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="Paste or edit Markdown resume text here..."
        />
      )}
    </div>
  );
}
