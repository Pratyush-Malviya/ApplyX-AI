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
    <div className="space-y-8 max-w-5xl mx-auto text-gray-900 pb-12">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Candidate Resumes</h1>
        <p className="text-sm text-gray-600 mt-1">Upload PDF or DOCX resumes to save them to your profile and power 1-click AI tailoring.</p>
      </div>

      {/* Upload Drag & Drop */}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className={`bg-white rounded-3xl p-10 text-center transition-all duration-300 border-2 shadow-sm ${
          dragOver ? "border-blue-500 bg-blue-50/50 shadow-md" : "border-dashed border-gray-300 hover:border-blue-500"
        }`}>
        
        {parsing ? (
          <div className="max-w-md mx-auto space-y-6 py-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Analyzing Resume...</h2>
              <p className="text-sm text-gray-600">Extracting skills, experience, and candidate contact details.</p>
            </div>
            
            {/* Premium Skeleton Loaders */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md"></div>
              <div className="h-4 bg-gray-200 animate-pulse w-5/6 rounded-md"></div>
              <div className="h-4 bg-gray-200 animate-pulse w-4/6 rounded-md"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-5">
            <div className={`p-4 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center transition-colors ${dragOver ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload Master Resume</h2>
              <p className="text-xs text-gray-500 mt-1">Drag and drop your PDF, DOCX, or TXT file here.</p>
            </div>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer font-bold text-xs shadow-md transition-colors">
                <Upload className="h-4 w-4" />
                Select File
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleInput} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Saved Resumes Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Saved Resumes <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-bold">{savedResumesList.length}</span>
          </h3>
          <Link href="/profile" className="text-xs font-bold text-blue-600 hover:underline">
            View Candidate Profile &rarr;
          </Link>
        </div>

        {savedResumesList.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-xs text-gray-500">No saved resumes yet. Upload a resume above to persist it in your profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedResumesList.map((r) => (
              <div key={r.id} className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${r.isActive ? "bg-blue-50/80 border-2 border-blue-400 shadow-sm" : "bg-gray-50 border border-gray-200 hover:border-gray-300"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${r.isActive ? "bg-blue-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{r.fileName}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="self-end sm:self-auto">
                  {r.isActive ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div> Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(r.id)}
                      className="text-xs font-bold text-gray-700 hover:text-blue-600 bg-white hover:bg-gray-100 px-3.5 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm"
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