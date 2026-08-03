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

  useEffect(() => {
    setSavedResumesList(getLocalResumes());
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.push("/auth/login"); return; }
      setPageLoading(false);
    });
  }, [client, supabaseLoading]);

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
      });

      setSavedResumesList(getLocalResumes());

      // If Supabase client exists, attempt DB save as well
      if (client) {
        client.auth.getUser().then(({ data: { user } }: any) => {
          if (user) {
            client.from("resumes").insert({
              user_id: user.id,
              file_name: file.name,
              file_path: file.name,
              file_type: file.type || "application/pdf",
              parsed_text: result.text,
              parsed_sections: result.sections,
            }).then(() => console.log("Saved to Supabase resumes table"));
          }
        });
      }
    } catch {
      alert("Failed to parse resume. Please try again.");
    }
    setParsing(false);
  }, [client]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }, [handleFile]);
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); }, [handleFile]);

  const handleSetActive = (id: string) => {
    setActiveLocalResume(id);
    setSavedResumesList(getLocalResumes());
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
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4 text-lg">Extracted Sections</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {Object.entries(parsedResume.sections).map(([key, value]) =>
                value ? (
                  <div key={key} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">{key}</h3>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{value}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4 text-lg">Full Extracted Text</h2>
            <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar bg-black/40 p-5 rounded-xl font-mono border border-white/5">
              {parsedResume.text}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/tailor" className="glass-panel-hover inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 border-0">
            <Wand2 className="h-4 w-4" /> Tailor Resume for JD
          </Link>
          <Link href="/cover-letters" className="glass-panel-hover inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 border-0">
            <Mail className="h-4 w-4" /> Generate Cover Letter
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto text-gray-200">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage Candidate <span className="gradient-text">Resumes</span></h1>
        <p className="text-base text-gray-400 mt-2">Upload PDF or DOCX resumes to save them to your profile and power 1-click AI tailoring.</p>
      </div>

      {/* Upload Drag & Drop */}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className={`glass-panel rounded-3xl p-12 text-center transition-all duration-300 border-2 ${
          dragOver ? "border-blue-500 bg-blue-900/20 shadow-2xl shadow-blue-500/10" : "border-dashed border-white/20 hover:border-blue-400/50"
        }`}>
        
        {parsing ? (
          <div className="max-w-md mx-auto space-y-8 py-4">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Analyzing Resume...</h2>
              <p className="text-sm text-gray-400">Extracting skills, experience, and structuring for AI matching.</p>
            </div>
            
            {/* Premium Skeleton Loaders */}
            <div className="space-y-4">
              <div className="shimmer-loader h-4 w-full rounded-md opacity-70"></div>
              <div className="shimmer-loader h-4 w-5/6 rounded-md opacity-60"></div>
              <div className="shimmer-loader h-4 w-4/6 rounded-md opacity-50"></div>
              <div className="flex gap-4 mt-6">
                 <div className="shimmer-loader h-10 w-24 rounded-lg opacity-80"></div>
                 <div className="shimmer-loader h-10 w-24 rounded-lg opacity-60"></div>
                 <div className="shimmer-loader h-10 w-24 rounded-lg opacity-40"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            <div className={`p-5 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center transition-colors ${dragOver ? "bg-blue-600/30 text-blue-400" : "bg-white/5 text-gray-300"}`}>
              <Upload className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upload Master Resume</h2>
            <p className="text-sm text-gray-400 leading-relaxed">Drag and drop your PDF, DOCX, or TXT file here. We will securely parse it using our localized models.</p>
            <div className="pt-2">
              <label className="glass-panel-hover inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl cursor-pointer font-bold text-sm shadow-xl shadow-blue-500/20 border-0">
                <Upload className="h-5 w-5" />
                Select File
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleInput} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Saved Resumes Section */}
      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            Saved Resumes <span className="bg-white/10 px-2 py-0.5 rounded-md text-sm">{savedResumesList.length}</span>
          </h3>
          <Link href="/profile" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            View Candidate Profile &rarr;
          </Link>
        </div>

        {savedResumesList.length === 0 ? (
          <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5">
            <p className="text-sm text-gray-500">No saved resumes yet. Upload a resume above to persist it in your profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savedResumesList.map((r) => (
              <div key={r.id} className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${r.isActive ? "glass-panel border-blue-500/40 bg-blue-900/10" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${r.isActive ? "bg-blue-500/20" : "bg-white/10"}`}>
                    <FileText className={`h-6 w-6 ${r.isActive ? "text-blue-400" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{r.fileName}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="self-end sm:self-auto">
                  {r.isActive ? (
                    <span className="text-[12px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(r.id)}
                      className="text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors"
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