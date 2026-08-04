"use me";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getLocalProfile,
  getLocalResumes,
  CandidateProfile,
  SavedResume,
} from "@/lib/profile-store";
import {
  FileText,
  Mail,
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

  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    // Load local orchestrated state
    const p = getLocalProfile();
    const r = getLocalResumes();

    setProfile(p);
    setResumes(r);

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
        </div>
      </div>

    </div>
  );
}