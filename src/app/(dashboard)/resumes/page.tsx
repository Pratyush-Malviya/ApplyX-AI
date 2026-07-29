"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { parseResume } from "@/lib/resume-parser";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function ResumesPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [parsedResume, setParsedResume] = useState<{ text: string; sections: Record<string, string> } | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
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

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|txt)$/i)) { alert("Please upload a PDF, DOCX, or TXT file"); return; }
    setParsing(true); setFileName(file.name);
    try { const result = await parseResume(file); setParsedResume(result); }
    catch { alert("Failed to parse resume. Please try again."); }
    setParsing(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }, [handleFile]);
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); }, [handleFile]);

  if (pageLoading || supabaseLoading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (!client) return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2><p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p></div>;

  if (parsedResume) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">{fileName}</h1><p className="text-gray-500 mt-1">Parsed successfully — review extracted sections</p></div>
          <button onClick={() => setParsedResume(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">{t("resumes.uploadAnother")}</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{t("resumes.extractedSections")}</h2>
            <div className="space-y-4">{Object.entries(parsedResume.sections).map(([key, value]) => value ? (<div key={key}><h3 className="text-sm font-medium text-blue-600 uppercase tracking-wide">{key}</h3><p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap line-clamp-4">{value}</p></div>) : null)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{t("resumes.fullText")}</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-[600px] overflow-y-auto">{parsedResume.text}</pre>
          </div>
        </div>
        <div className="flex gap-3">
          <a href="/tailor" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t("resumes.tailorBtn")}</a>
          <a href="/cover-letters" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">{t("resumes.generateBtn")}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">{t("resumes.title")}</h1><p className="text-gray-500 mt-1">{t("resumes.subtitle")}</p></div>
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className={`bg-white rounded-xl p-12 shadow-sm border-2 border-dashed text-center transition-colors ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}>
        <div className="max-w-md mx-auto space-y-4">
          <div className={`p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center ${dragOver ? "bg-blue-100" : "bg-blue-50"}`}>
            <svg className={`w-8 h-8 ${dragOver ? "text-blue-700" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{parsing ? t("resumes.parsing") : t("resumes.uploadFirst")}</h2>
          <p className="text-gray-500">{parsing ? "Extracting text and sections..." : t("resumes.dropzone")}</p>
          {parsing ? <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {t("resumes.chooseFile")}
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleInput} className="hidden" />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}