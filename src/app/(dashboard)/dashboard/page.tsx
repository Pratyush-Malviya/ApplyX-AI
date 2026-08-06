"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getLocalProfile,
  getLocalResumes,
  CandidateProfile,
  SavedResume,
} from "@/lib/profile-store";
import { checkResumeHealth } from "@/lib/resume-health-check";
import { OnboardingTour } from "@/components/onboarding-tour";
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
  Bot,
  MessageSquare,
  DollarSign,
  Briefcase,
  Activity,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  // Profile & Sync state
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [resumes, setResumes] = useState<SavedResume[]>([]);

  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

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
      setUser(user);

      // Load user-scoped state
      const p = getLocalProfile(user.id);
      const r = getLocalResumes(user.id);

      setProfile(p);
      setResumes(r);

      // Auto show tour ONLY for first-time users who have never seen/dismissed it and have no resume
      const tourDismissedKey = `applyx_tour_dismissed_${user.id}`;
      const hasDismissed = typeof window !== "undefined" && localStorage.getItem(tourDismissedKey) === "true";
      if (!hasDismissed && !p.activeResumeText && r.length === 0) {
        setShowTour(true);
      }

      setPageLoading(false);
    });
  }, [client, supabaseLoading, router]);

  const handleDismissTour = () => {
    if (user?.id && typeof window !== "undefined") {
      localStorage.setItem(`applyx_tour_dismissed_${user.id}`, "true");
    }
    setShowTour(false);
  };

  if (pageLoading || supabaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  // Calculate real-time stats & health score
  const activeResumeName = profile?.activeResumeName || (resumes.length > 0 ? resumes[0].fileName : null);
  const activeResumeText = profile?.activeResumeText || (resumes.length > 0 ? resumes[0].parsedText : "");
  const totalResumes = resumes.length;

  const health = checkResumeHealth(activeResumeText || "", profile?.activeResumeSections);

  const statsList = [
    {
      label: "Active Candidate Resume",
      value: activeResumeName ? "1 Active" : "No Resume",
      subText: activeResumeName || "Upload a resume to start",
      icon: FileText,
      badge: activeResumeName ? "Active" : "Pending",
      color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200/60",
      link: "/resumes",
    },
    {
      label: "ATS Health Audit",
      value: activeResumeText ? `${health.score}% (${health.grade})` : "N/A",
      subText: activeResumeText ? health.summary : "Upload resume to audit ATS score",
      icon: Activity,
      badge: activeResumeText ? health.grade : "Needs Resume",
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/60",
      link: "/resumes",
    },
    {
      label: "Saved Resumes",
      value: `${totalResumes} Resumes`,
      subText: "Persisted in candidate profile",
      icon: Wand2,
      badge: "Synced",
      color: "from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200/60",
      link: "/resumes",
    },
    {
      label: "Hours Saved",
      value: totalResumes > 0 ? "12.5 hrs" : "0 hrs",
      subText: "Automated AI tailoring speed",
      icon: Clock,
      badge: "Automated",
      color: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/60",
      link: "/tailor",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Onboarding Tour Modal */}
      <OnboardingTour isOpen={showTour} onClose={handleDismissTour} />

      {/* Premium Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-300 animate-pulse" />
              <span>AI Job Copilot v2.4 Active</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {t("dashboard.welcome")} <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">{user?.user_metadata?.full_name || profile?.fullName || "Candidate"}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Target Role: <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">{profile?.targetRole || "Software Engineer"}</span> • Location: <span className="text-slate-200">{profile?.location || "Bengaluru / Remote"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowTour(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-violet-300" /> Quick Tour
            </button>
            <Link
              href="/tailor"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" /> Tailor Resume <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.link}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-violet-300 hover:shadow-md transition-all duration-200 group block space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} border shadow-xs`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-xl font-black text-slate-900 group-hover:text-violet-700 transition-colors">
                  {stat.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{stat.subText}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Core Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/tailor"
          className="group relative rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-violet-300 transition-all space-y-4 overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-110 transition-transform">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors flex items-center gap-1.5">
              Tailor Resume <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Match job description keywords using 1-page STAR bullet point rewrite algorithms.
            </p>
          </div>
        </Link>

        <Link
          href="/cover-letters"
          className="group relative rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-violet-300 transition-all space-y-4 overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
              Cover Letters <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generate 3-paragraph persuasive STAR narrative cover letters tailored to company culture.
            </p>
          </div>
        </Link>

        <Link
          href="/analyze"
          className="group relative rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-violet-300 transition-all space-y-4 overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
              ATS Matcher <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Audit semantic keyword match percentage and missing hard skills against target job description.
            </p>
          </div>
        </Link>
      </div>

      {/* Active Resume Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Active Resume Profile</h2>
              <p className="text-xs text-slate-500">Currently selected candidate resume for tailoring</p>
            </div>
          </div>

          <Link
            href="/resumes"
            className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
          >
            Manage All Resumes <ArrowRight size={14} />
          </Link>
        </div>

        {activeResumeName ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {activeResumeName}
              </span>
              <p className="text-xs text-slate-500">
                {activeResumeText ? `${activeResumeText.slice(0, 140)}...` : "Resume text loaded"}
              </p>
            </div>

            <Link
              href="/tailor"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 transition-opacity shrink-0"
            >
              Tailor Now
            </Link>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
            <FileText className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No active resume uploaded yet</p>
            <Link
              href="/resumes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-violet-700 transition-colors"
            >
              Upload Resume PDF
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}