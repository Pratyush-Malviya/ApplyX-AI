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

  if (pageLoading || supabaseLoading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;

  if (parsedResume) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> {fileName}
            </h1>
            <p className="text-xs text-emerald-800 mt-0.5">Parsed successfully & saved to candidate profile!</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setParsedResume(null)} className="px-4 py-2 text-xs font-semibold border rounded-lg hover:bg-white bg-white/80">
              Upload Another
            </button>
            <Link href="/profile" className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black">
              View Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Extracted Sections</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {Object.entries(parsedResume.sections).map(([key, value]) =>
                value ? (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide">{key}</h3>
                    <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{value}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Full Extracted Text</h2>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-[500px] overflow-y-auto bg-gray-50 p-4 rounded-lg font-mono">
              {parsedResume.text}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/tailor" className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">
            <Wand2 className="h-4 w-4" /> Tailor Resume for JD
          </Link>
          <Link href="/cover-letters" className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm">
            <Mail className="h-4 w-4" /> Generate Cover Letter
          </Link>
          <Link href="/jobs" className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm">
            <Sparkles className="h-4 w-4" /> Match Web Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Candidate Resumes</h1>
        <p className="text-sm text-gray-500 mt-1">Upload PDF or DOCX resumes to save them to your profile and power 1-click AI tailoring.</p>
      </div>

      {/* Upload Drag & Drop */}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className={`bg-white rounded-2xl p-10 shadow-sm border-2 border-dashed text-center transition-all ${
          dragOver ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-blue-400"
        }`}>
        <div className="max-w-md mx-auto space-y-4">
          <div className={`p-4 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center ${dragOver ? "bg-blue-100" : "bg-blue-50 text-blue-600"}`}>
            <Upload className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{parsing ? "Extracting & Saving Resume..." : "Upload Master Resume"}</h2>
          <p className="text-xs text-gray-500">{parsing ? "AI is parsing skills and saving to your candidate profile..." : "Drag and drop your PDF, DOCX, or TXT file here"}</p>
          {parsing ? (
            <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer font-semibold text-sm shadow-md transition-transform hover:scale-105">
              <Upload className="h-4 w-4" />
              Choose File from Device
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleInput} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Saved Resumes Section */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Saved Resumes in Profile ({savedResumesList.length})</h3>
          <Link href="/profile" className="text-xs font-semibold text-blue-600 hover:underline">
            View Candidate Profile →
          </Link>
        </div>

        {savedResumesList.length === 0 ? (
          <p className="text-xs text-gray-500">No saved resumes yet. Upload a resume above to persist it in your candidate profile.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedResumesList.map((r) => (
              <div key={r.id} className={`p-4 rounded-xl border flex items-center justify-between ${r.isActive ? "bg-blue-50/70 border-blue-300" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <FileText className={`h-6 w-6 ${r.isActive ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{r.fileName}</h4>
                    <p className="text-[10px] text-gray-500">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  {r.isActive ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                      Active Profile
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(r.id)}
                      className="text-xs font-semibold text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md border border-blue-200"
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