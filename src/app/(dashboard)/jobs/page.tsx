"use me";
"use client";

import { useState, useEffect } from "react";
import { getLocalProfile, CandidateProfile } from "@/lib/profile-store";
import { JobPosting } from "@/app/api/scrape-jobs/route";
import {
  Search,
  Sparkles,
  MapPin,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Mail,
  BookmarkPlus,
  Briefcase,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [role, setRole] = useState("Software Engineer");
  const [location, setLocation] = useState("Remote / India");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const router = useRouter();

  useEffect(() => {
    const p = getLocalProfile();
    setProfile(p);
    if (p.targetRole) setRole(p.targetRole);
    if (p.location) setLocation(p.location);

    // Initial job scrape on load
    fetchJobs(p.targetRole || "Software Engineer", p.location || "Remote / India", p.activeResumeText);
  }, []);

  const fetchJobs = async (targetRole: string, targetLoc: string, resumeText?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/scrape-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          location: targetLoc,
          resumeText: resumeText || profile?.activeResumeText || "",
        }),
      });

      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(role, location, profile?.activeResumeText);
  };

  const handleAutoMatchFromResume = () => {
    if (!profile) return;
    setRole(profile.targetRole || "Software Engineer");
    setLocation(profile.location || "Remote");
    fetchJobs(profile.targetRole || "Software Engineer", profile.location || "Remote", profile.activeResumeText);
  };

  const handleTailorForJob = (job: JobPosting) => {
    // Pass job description to tailor page via localStorage/sessionStorage
    sessionStorage.setItem(
      "applyx_target_jd",
      JSON.stringify({
        title: job.title,
        company: job.company,
        description: job.description,
      })
    );
    router.push("/tailor");
  };

  const handleSaveToTracker = (job: JobPosting) => {
    setSavedJobIds((prev) => new Set(prev).add(job.id));
    alert(`Saved "${job.title} at ${job.company}" to your Applications Tracker!`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/60 px-3 py-1 text-xs font-semibold text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real-Time Web Scraper & AI Matcher</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Web Job Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              We scrape live tech positions from LinkedIn, Naukri, Indeed, and Instahyre, scoring each job against your saved candidate profile.
            </p>
          </div>

          {profile?.activeResumeName ? (
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Active Resume Loaded
              </div>
              <p className="text-slate-300 font-semibold">{profile.activeResumeName}</p>
            </div>
          ) : (
            <Link
              href="/resumes"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              + Upload Resume to Profile
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Form */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-5 relative">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Job Role / Title</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior React Developer"
                className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="sm:col-span-4 relative">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Target Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru / Remote"
                className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="sm:col-span-3 flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
              Search Jobs
            </button>
          </div>

        </form>

        {profile?.activeResumeText && (
          <div className="pt-2 flex justify-between items-center border-t text-xs">
            <span className="text-gray-500">Auto-matched using candidate profile skills</span>
            <button
              onClick={handleAutoMatchFromResume}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> Re-Match from Profile Resume
            </button>
          </div>
        )}
      </div>

      {/* Scraped Jobs List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" /> Scraped Web Positions ({jobs.length})
          </h2>
          <span className="text-xs text-gray-500">Sorted by Gemini AI ATS Match Score</span>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Scraping web portals and calculating Gemini AI match scores...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border space-y-3">
            <p className="text-base font-bold text-gray-800">No scraped jobs found for this search.</p>
            <p className="text-xs text-gray-500">Try adjusting your job title or location terms.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isHighMatch = job.matchScore >= 88;
              const isMediumMatch = job.matchScore >= 75 && job.matchScore < 88;
              const isSaved = savedJobIds.has(job.id);

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm space-y-4 relative"
                >
                  {/* Top Bar: Title, Company, Match Pill */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-extrabold text-gray-900">{job.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border">
                          {job.portal}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-gray-900">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" /> {job.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" /> {job.location}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{job.salary}</span>
                      </div>
                    </div>

                    {/* ATS Match Score Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`flex flex-col items-end px-3.5 py-1.5 rounded-xl border ${
                        isHighMatch
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : isMediumMatch
                          ? "bg-amber-50 border-amber-300 text-amber-800"
                          : "bg-gray-50 border-gray-300 text-gray-700"
                      }`}>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider">AI ATS Match</div>
                        <div className="text-lg font-black">{job.matchScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Verdict */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Gemini AI Match Verdict
                    </div>
                    <p className="text-slate-200 text-xs">{job.aiVerdict}</p>
                  </div>

                  {/* Description Snippet */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>

                  {/* Skills breakdown */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-700 text-[11px]">Matched Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {job.matchedSkills.map((sk, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {job.missingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-800 text-[11px]">Missing Keywords:</span>
                        <div className="flex flex-wrap gap-1">
                          {job.missingSkills.map((sk, idx) => (
                            <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                              + {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTailorForJob(job)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Tailor Resume for Job
                      </button>

                      <Link
                        href="/cover-letters"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        <Mail className="h-3.5 w-3.5" /> Cover Letter
                      </Link>

                      <button
                        onClick={() => handleSaveToTracker(job)}
                        disabled={isSaved}
                        className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          isSaved
                            ? "bg-gray-100 text-gray-500 border-gray-200"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        {isSaved ? "Saved" : "Save to Tracker"}
                      </button>
                    </div>

                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Apply on {job.portal} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
