"use me";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getLocalProfile,
  getLocalResumes,
  getLocalApplications,
  CandidateProfile,
  SavedResume,
  SavedApplication,
} from "@/lib/profile-store";
import {
  FileText,
  Mail,
  Briefcase,
  TrendingUp,
  Sparkles,
  Wand2,
  Search,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Profile & Sync state
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [applications, setApplications] = useState<SavedApplication[]>([]);

  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    // Load local orchestrated state
    const p = getLocalProfile();
    const r = getLocalResumes();
    const a = getLocalApplications();

    setProfile(p);
    setResumes(r);
    setApplications(a);

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
      setUser(user);
      setPageLoading(false);
    });
  }, [client, supabaseLoading, router]);

  if (pageLoading || supabaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Calculate real-time stats
  const activeResumeName = profile?.activeResumeName || (resumes.length > 0 ? resumes[0].fileName : null);
  const totalResumes = resumes.length;
  const totalApplications = applications.length;
  const totalInterviews = applications.filter((app) => app.status === "interview").length;

  const statsList = [
    {
      label: "Active Candidate Resume",
      value: activeResumeName ? "1 Active" : "No Resume",
      subText: activeResumeName || "Upload a resume to start",
      icon: FileText,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      link: "/resumes",
    },
    {
      label: "Total Uploaded Resumes",
      value: `${totalResumes} Saved`,
      subText: "Persisted in profile store",
      icon: Wand2,
      color: "text-violet-600 bg-violet-50 border-violet-200",
      link: "/resumes",
    },
    {
      label: "Tracked Job Applications",
      value: `${totalApplications} Applications`,
      subText: "Saved from search & extension",
      icon: Briefcase,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      link: "/applications",
    },
    {
      label: "Interviews Scheduled",
      value: `${totalInterviews} Active Calls`,
      subText: "High interview callback rate",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      link: "/applications",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("dashboard.welcome")} {user?.user_metadata?.full_name || profile?.fullName || "Candidate"}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Targeting: <span className="font-bold text-gray-900">{profile?.targetRole || "Software Engineer"}</span> • {profile?.location || "Bengaluru / Remote"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4 text-violet-300" /> Match Web Jobs
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
          >
            Manage Profile
          </Link>
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.link}
              className="bg-white rounded-2xl p-5 shadow-sm border hover:border-blue-400 transition-all hover:scale-[1.01] block space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div>
                <div className="text-xl font-extrabold text-gray-900">{stat.value}</div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{stat.subText}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Active Profile Resume Showcase Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">Active Candidate Profile Resume</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Synced across all pages
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {activeResumeName ? `File: ${activeResumeName}` : "No active resume loaded yet"}
              </p>
            </div>
          </div>

          <Link
            href="/resumes"
            className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 border border-indigo-500/30 px-3 py-1.5 rounded-lg bg-indigo-950/60"
          >
            + Upload New Resume
          </Link>
        </div>

        {/* Top Parsed Skills Pill Cloud */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Extracted Candidate Skills:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.skills || ["React", "TypeScript", "Node.js"]).map((sk, i) => (
              <span
                key={i}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-indigo-200 border border-slate-700"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* 1-Click Orchestrated Actions */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/tailor"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all"
          >
            <span className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-violet-400" /> Tailor Active Resume
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href="/cover-letters"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all"
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" /> Write Cover Letter
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href="/jobs"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Find Scraped Jobs
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Recent Applications Pipeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-gray-900">Recent Applications Pipeline ({applications.length})</h3>
          </div>
          <Link href="/applications" className="text-xs font-bold text-blue-600 hover:underline">
            View Applications Kanban Board →
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-xl space-y-2">
            <p className="text-xs text-gray-500">No applications saved yet.</p>
            <Link href="/jobs" className="text-xs font-bold text-blue-600 hover:underline inline-block">
              Search & Save Web Jobs →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 4).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{app.company}</h4>
                    <p className="text-[11px] text-gray-500">{app.role} • {app.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${
                    app.status === "interview"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : app.status === "offer"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : app.status === "applied"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-200 text-gray-700"
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}