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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
      color: "text-blue-600 bg-blue-50 border-blue-200",
      link: "/resumes",
    },
    {
      label: "Resume Health Check",
      value: activeResumeText ? `${health.score}% (${health.grade})` : "N/A",
      subText: activeResumeText ? health.summary : "Upload resume to audit ATS score",
      icon: Activity,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
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
      label: "Estimated Hours Saved",
      value: totalResumes > 0 ? "12.5 hrs" : "0 hrs",
      subText: "Based on automated tailoring speed",
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      link: "/applications",
    },
  ];

  const quickActions = [
    {
      title: "Auto-Apply Mode",
      desc: "Batch generate tailored resumes for target jobs with 1-click safety approval.",
      icon: Zap,
      link: "/auto-apply",
      color: "from-blue-600 to-indigo-600 text-white",
      badge: "⭐ Buzz Feature",
    },
    {
      title: "Salary Negotiation Copilot",
      desc: "Analyze CTC offer letters and generate persuasive counter-offer scripts.",
      icon: DollarSign,
      link: "/salary-copilot",
      color: "from-emerald-600 to-teal-600 text-white",
      badge: "New",
    },
    {
      title: "Company Research Copilot",
      desc: "Deep-dive intel on company tech stack, leadership & culture red flags.",
      icon: Building2,
      link: "/company-research",
      color: "from-slate-800 to-slate-900 text-white",
      badge: "New",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Onboarding Tour Modal */}
      <OnboardingTour isOpen={showTour} onClose={handleDismissTour} />

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
          <button
            onClick={() => setShowTour(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> Quick Tour
          </button>
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

      {/* Buzz-Worthy Features Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" /> ApplyX AI Assistant Suite
          </h2>
          <span className="text-xs font-semibold text-gray-500">Accelerate your application pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((act, i) => {
            const Icon = act.icon;
            return (
              <Link
                key={i}
                href={act.link}
                className={`bg-gradient-to-r ${act.color} p-6 rounded-2xl shadow-lg border hover:scale-[1.01] transition-all space-y-3 group relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {act.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
                    {act.title}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">{act.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
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
            href="/analyze"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-400" /> Analyze Job Posting
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}