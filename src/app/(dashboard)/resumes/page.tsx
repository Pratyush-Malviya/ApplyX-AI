"use me";
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { parseResume } from "@/lib/resume-parser";
import { useTranslation } from "@/lib/i18n";
import { saveLocalResume, getLocalResumes, setActiveLocalResume, SavedResume } from "@/lib/profile-store";
import { FileText, CheckCircle2, Upload, Sparkles, Wand2, Mail } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ResumesPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [parsedResume, setParsedResume] = useState<{ text: string; sections: Record<string, string> } | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [savedResumesList, setSavedResumesList] = useState<SavedResume[]>([]);

  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);
      setSavedResumesList(getLocalResumes(user.id));
      setPageLoading(false);
    });
  }, [client, supabaseLoading, router]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|txt)$/i)) { alert("Please upload a PDF, DOCX, or TXT file"); return; }
    setParsing(true); setFileName(file.name);
    try {
      const result = await parseResume(file);
      setParsedResume(result);

      // Save to candidate profile store automatically
      const newSaved = saveLocalResume({
        fileName: file.name,
        fileType: file.type || "application/pdf",
        parsedText: result.text,
        parsedSections: result.sections,
      }, userId);

      setSavedResumesList(getLocalResumes(userId));

      // If Supabase client exists, attempt DB save as well
      if (client && userId) {
        client.from("resumes").insert({
          user_id: userId,
          file_name: file.name,
          file_path: file.name,
          file_type: file.type || "application/pdf",
          parsed_text: result.text,
          parsed_sections: result.sections,
        }).then(() => console.log("Saved to Supabase resumes table"));
      }
    } catch {
      alert("Failed to parse resume. Please try again.");
    }
    setParsing(false);
  }, [client, userId]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }, [handleFile]);
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); }, [handleFile]);

  const handleSetActive = (id: string) => {
    setActiveLocalResume(id, userId);
    setSavedResumesList(getLocalResumes(userId));
  };

  if (pageLoading || supabaseLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="shimmer-loader h-12 w-64 rounded-xl"></div>
      </div>
    );
  }

  if (parsedResume) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto text-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border-emerald-500/30">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" /> <span className="gradient-text">{fileName}</span>
            </h1>
            <p className="text-sm text-emerald-400/80 mt-1">Parsed successfully & saved to candidate profile!</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setParsedResume(null)} className="px-5 py-2.5 text-sm font-semibold border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
              Upload Another
            </button>
            <Link href="/profile" className="px-5 py-2.5 text-sm font-bold bg-white text-black rounded-xl hover:bg-gray-200 transition-colors">
              View Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Extracted Sections</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {Object.entries(parsedResume.sections).map(([key, value]) =>
                value ? (
                  <div key={key} className="p-4 bg-gray-50 rounded-xl border border-gray-200 transition-colors">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{key}</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{value}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Full Extracted Text</h2>
            <pre className="text-xs text-gray-800 whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50 p-5 rounded-xl font-mono border border-gray-200 font-medium">
              {parsedResume.text}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/tailor" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
            <Wand2 className="h-4 w-4" /> Tailor Resume for JD
          </Link>
          <Link href="/cover-letters" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
            <Mail className="h-4 w-4" /> Generate Cover Letter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200/80 text-violet-700 text-[11px] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            Resume Management & ATS Parser
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Candidate Resumes</h1>
          <p className="text-xs text-slate-500 mt-1">Upload PDF or DOCX resumes to save them to your profile and power 1-click AI tailoring.</p>
        </div>

        <Link
          href="/tailor"
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-violet-600/20 shrink-0"
        >
          Go to AI Tailor
        </Link>
      </div>

      {/* Upload Drag & Drop */}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className={`bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center transition-all duration-300 border-2 shadow-xs ${
          dragOver ? "border-violet-500 bg-violet-50/40 shadow-md" : "border-dashed border-slate-300 hover:border-violet-400 hover:bg-slate-50/50"
        }`}>
        
        {parsing ? (
          <div className="max-w-md mx-auto space-y-6 py-4">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900">Analyzing Resume...</h2>
              <p className="text-xs text-slate-500">Extracting skills, work experience, and candidate contact details.</p>
            </div>
            
            {/* Premium Skeleton Loaders */}
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 animate-pulse w-full rounded-md"></div>
              <div className="h-4 bg-slate-200 animate-pulse w-5/6 rounded-md"></div>
              <div className="h-4 bg-slate-200 animate-pulse w-4/6 rounded-md"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-5">
            <div className={`p-4 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center transition-all ${dragOver ? "bg-violet-600 text-white shadow-lg" : "bg-violet-50 text-violet-600 border border-violet-200/80"}`}>
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Upload Master Resume</h2>
              <p className="text-xs text-slate-500 mt-1">Drag and drop your PDF, DOCX, or TXT file here.</p>
            </div>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl cursor-pointer font-bold text-xs shadow-md shadow-violet-600/25 transition-all hover:scale-[1.01]">
                <Upload className="h-4 w-4" />
                Select Resume File
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleInput} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Saved Resumes Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-600" />
            Saved Candidate Resumes <span className="bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-md text-xs font-bold">{savedResumesList.length}</span>
          </h3>
          <Link href="/profile" className="text-xs font-bold text-violet-600 hover:text-violet-800">
            View Profile →
          </Link>
        </div>

        {savedResumesList.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-xs text-slate-500">No saved resumes yet. Upload a resume above to persist it in your candidate profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedResumesList.map((r) => (
              <div key={r.id} className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${r.isActive ? "bg-violet-50/80 border-2 border-violet-400/80 shadow-xs" : "bg-slate-50/70 border border-slate-200/80 hover:border-slate-300"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${r.isActive ? "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs" : "bg-white text-slate-400 border border-slate-200"}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{r.fileName}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="self-end sm:self-auto shrink-0">
                  {r.isActive ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300/80 px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div> Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(r.id)}
                      className="text-xs font-bold text-slate-700 hover:text-violet-700 bg-white hover:bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}