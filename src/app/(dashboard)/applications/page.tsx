"use me";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";
import {
  getLocalApplications,
  saveLocalApplication,
  updateLocalApplicationStatus,
  deleteLocalApplication,
  SavedApplication,
} from "@/lib/profile-store";
import { Briefcase, Plus, Sparkles, Building2, Trash2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statuses: Array<{ key: SavedApplication["status"]; labelKey: string; color: string }> = [
  { key: "saved", labelKey: "Saved", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { key: "applied", labelKey: "Applied", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { key: "interview", labelKey: "Interview", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { key: "offer", labelKey: "Offer Received", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { key: "rejected", labelKey: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-300" },
];

export default function ApplicationsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [form, setForm] = useState<{ company: string; role: string; notes: string; status: SavedApplication["status"] }>({
    company: "",
    role: "",
    notes: "",
    status: "saved",
  });

  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) {
      setPageLoading(false);
      return;
    }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
      setApplications(getLocalApplications(user.id));
      setPageLoading(false);
    });
  }, [client, supabaseLoading, router]);

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.role || !userId) return;

    saveLocalApplication({
      company: form.company,
      role: form.role,
      status: form.status,
      notes: form.notes,
    }, userId);

    setApplications(getLocalApplications(userId));
    setForm({ company: "", role: "", notes: "", status: "saved" });
    setShowForm(false);
  };

  const handleStatusChange = (id: string, newStatus: SavedApplication["status"]) => {
    const updated = updateLocalApplicationStatus(id, newStatus);
    setApplications(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteLocalApplication(id);
    setApplications(updated);
  };

  if (pageLoading || supabaseLoading)
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Job Applications Kanban Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Track your job search pipeline from saved positions to offer letter.</p>
        </div>

        <div className="flex items-center gap-3">


          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Manual Application Form */}
      {showForm && (
        <form onSubmit={handleAddApplication} className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
          <h2 className="font-bold text-gray-900">Add New Job Application</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Swiggy"
                required
                className="w-full px-3 py-2 border rounded-xl text-xs text-black bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title / Role</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Senior Frontend Engineer"
                required
                className="w-full px-3 py-2 border rounded-xl text-xs text-black bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Application Stage</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-xl text-xs text-black bg-white focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.labelKey}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Referral name, round dates, compensation notes..."
              rows={2}
              className="w-full px-3 py-2 border rounded-xl text-xs text-black bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
              Save Application
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-xl text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => {
          const apps = applications.filter((a) => a.status === status.key);
          return (
            <div key={status.key} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between border-b pb-2">
                <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-md border ${status.color}`}>
                  {status.labelKey}
                </span>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {apps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {apps.map((app) => (
                  <div key={app.id} className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs hover:border-blue-300 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{app.company}</h4>
                        <p className="text-[11px] text-gray-600 font-medium">{app.role}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete application"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-gray-500 bg-white p-2 rounded border line-clamp-2">
                        {app.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px] text-gray-400">
                      <span>{app.date}</span>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                        className="text-[10px] font-bold border rounded px-1.5 py-0.5 text-black bg-white"
                      >
                        {statuses.map((s) => (
                          <option key={s.key} value={s.key}>
                            → {s.labelKey}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {apps.length === 0 && (
                  <div className="text-center py-10 text-[11px] text-gray-400 border border-dashed rounded-xl">
                    No applications in {status.labelKey.toLowerCase()} stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}