"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";
declare var chrome: any;

const statuses = [
  { key: "saved", labelKey: "applications.saved", color: "bg-gray-100 text-gray-700" },
  { key: "applied", labelKey: "applications.applied", color: "bg-blue-100 text-blue-700" },
  { key: "interview", labelKey: "applications.interview", color: "bg-purple-100 text-purple-700" },
  { key: "offer", labelKey: "applications.offer", color: "bg-green-100 text-green-700" },
  { key: "rejected", labelKey: "applications.rejected", color: "bg-red-100 text-red-700" },
];

interface Application { id: string; company: string; role: string; status: string; date: string; notes: string; }

export default function ApplicationsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState({ company: "", role: "", notes: "", status: "saved" });
  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.push("/auth/login"); return; }
      loadApplications(); setPageLoading(false);
    });
  }, [client, supabaseLoading]);

  const loadApplications = async () => {
    chrome?.storage?.local?.get(["applications"], (result: any) => {
      if (result?.applications) setApplications(result.applications);
    });
  };

  const addApplication = () => {
    const app: Application = { id: Date.now().toString(), company: form.company, role: form.role, status: form.status, date: new Date().toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN"), notes: form.notes };
    const updated = [...applications, app]; setApplications(updated);
    chrome?.storage?.local?.set({ applications: updated });
    setForm({ company: "", role: "", notes: "", status: "saved" }); setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">{t("applications.title")}</h1><p className="text-gray-500 mt-1">{t("applications.subtitle")}</p></div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t("applications.addBtn")}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
          <h2 className="font-semibold text-gray-900">{t("applications.newApplication")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder={t("applications.company")} className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={t("applications.role")} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
              {statuses.map((s) => <option key={s.key} value={s.key}>{t(s.labelKey)}</option>)}
            </select>
          </div>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("applications.notes")} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={addApplication} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{t("applications.save")}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">{t("applications.cancel")}</button>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="p-4 bg-purple-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t("applications.noApps")}</h2>
            <p className="text-gray-500">{t("applications.noAppsDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map((status) => {
            const apps = applications.filter((a) => a.status === status.key);
            return (
              <div key={status.key} className="bg-white rounded-xl shadow-sm border p-4">
                <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mb-3 ${status.color}`}>{t(status.labelKey)} ({apps.length})</div>
                <div className="space-y-3">
                  {apps.map((app) => (
                    <div key={app.id} className="bg-gray-50 rounded-lg p-3 border text-sm">
                      <p className="font-medium text-gray-900 truncate">{app.company}</p>
                      <p className="text-gray-500 text-xs truncate">{app.role}</p>
                      <p className="text-gray-400 text-xs mt-1">{app.date}</p>
                      <div className="flex gap-1 mt-2">
                        <select value={app.status} onChange={(e) => {
                          const updated = applications.map((a) => a.id === app.id ? { ...a, status: e.target.value } : a);
                          setApplications(updated); chrome?.storage?.local?.set({ applications: updated });
                        }} className="text-xs border rounded px-1 py-0.5 flex-1">
                          {statuses.map((s) => <option key={s.key} value={s.key}>{t(s.labelKey)}</option>)}
                        </select>
                        <button onClick={() => { const updated = applications.filter((a) => a.id !== app.id); setApplications(updated); chrome?.storage?.local?.set({ applications: updated }); }} className="text-red-500 text-xs px-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}