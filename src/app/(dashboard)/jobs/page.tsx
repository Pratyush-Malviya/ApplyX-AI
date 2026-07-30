"use client";

import { useState, useEffect } from "react";
import { getLocalProfile, saveLocalApplication, CandidateProfile } from "@/lib/profile-store";
import { JobPosting } from "@/app/api/scrape-jobs/route";
import {
  Search,
  Sparkles,
  MapPin,
  Building2,
  ExternalLink,
  CheckCircle2,
  Wand2,
  Mail,
  BookmarkPlus,
  Briefcase,
  SlidersHorizontal,
  FileText,
  Filter,
  Layers,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Building,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ViewTab = "recommended" | "search";

export default function JobsPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("recommended");

  // Filter States
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("All");
  const [experienceLevel, setExperienceLevel] = useState("All");
  const [portal, setPortal] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"matchScore" | "recent">("matchScore");
  const [showFilters, setShowFilters] = useState(true);

  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const router = useRouter();

  useEffect(() => {
    const p = getLocalProfile();
    setProfile(p);
    
    // Set default search parameters from candidate profile
    const defaultRole = p.targetRole || "Software Engineer";
    const defaultLoc = p.location || "Remote / India";
    setRole(defaultRole);
    setLocation(defaultLoc);

    // Initial fetch based on whether active resume exists
    if (p.activeResumeText) {
      setActiveTab("recommended");
      fetchJobs({
        targetRole: defaultRole,
        targetLoc: defaultLoc,
        resumeText: p.activeResumeText,
        isRecommended: true,
      });
    } else {
      setActiveTab("search");
      fetchJobs({
        targetRole: defaultRole,
        targetLoc: defaultLoc,
        resumeText: "",
        isRecommended: false,
      });
    }
  }, []);

  const fetchJobs = async (params: {
    targetRole?: string;
    targetLoc?: string;
    resumeText?: string;
    isRecommended?: boolean;
    jobTypeVal?: string;
    expVal?: string;
    portalVal?: string;
    minScoreVal?: number;
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/scrape-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: params.targetRole !== undefined ? params.targetRole : role,
          location: params.targetLoc !== undefined ? params.targetLoc : location,
          resumeText: params.resumeText !== undefined ? params.resumeText : profile?.activeResumeText || "",
          jobType: params.jobTypeVal || jobType,
          experienceLevel: params.expVal || experienceLevel,
          portal: params.portalVal || portal,
          minScore: params.minScoreVal !== undefined ? params.minScoreVal : minScore,
          isRecommendedMode: params.isRecommended !== undefined ? params.isRecommended : activeTab === "recommended",
        }),
      });

      const data = await res.json();
      if (data.jobs) {
        let sorted = [...data.jobs];
        if (sortBy === "matchScore") {
          sorted.sort((a, b) => b.matchScore - a.matchScore);
        }
        setJobs(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
    setLoading(false);
  };

  const handleTabSwitch = (tab: ViewTab) => {
    setActiveTab(tab);
    if (tab === "recommended") {
      fetchJobs({
        targetRole: profile?.targetRole || role || "Software Engineer",
        targetLoc: profile?.location || location || "Remote",
        resumeText: profile?.activeResumeText || "",
        isRecommended: true,
      });
    } else {
      fetchJobs({
        targetRole: role,
        targetLoc: location,
        resumeText: profile?.activeResumeText || "",
        isRecommended: false,
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs({
      targetRole: role,
      targetLoc: location,
      isRecommended: activeTab === "recommended",
    });
  };

  const handleResetFilters = () => {
    setRole(profile?.targetRole || "Software Engineer");
    setLocation(profile?.location || "Remote / India");
    setJobType("All");
    setExperienceLevel("All");
    setPortal("All");
    setMinScore(0);
    fetchJobs({
      targetRole: profile?.targetRole || "Software Engineer",
      targetLoc: profile?.location || "Remote / India",
      jobTypeVal: "All",
      expVal: "All",
      portalVal: "All",
      minScoreVal: 0,
      isRecommended: activeTab === "recommended",
    });
  };

  const handleTailorForJob = (job: JobPosting) => {
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
    saveLocalApplication({
      company: job.company,
      role: job.title,
      status: "saved",
      notes: `Source: ${job.portal} • Location: ${job.location} • ATS Score: ${job.matchScore}%\nApply URL: ${job.applyUrl}`,
      jobUrl: job.applyUrl,
      matchScore: job.matchScore,
    });
    setSavedJobIds((prev) => new Set(prev).add(job.id));
    alert(`Saved "${job.title} at ${job.company}" to your Application Tracker!`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/60 px-3 py-1 text-xs font-semibold text-violet-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Real-Time Market Job Aggregator & AI Matcher</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Web Jobs & AI Career Match
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore current market positions across top job portals (LinkedIn, Naukri, Indeed, Glassdoor, Instahyre). Automatically matched & scored against your candidate profile.
            </p>
          </div>

          {/* Active Resume Status Card */}
          {profile?.activeResumeName ? (
            <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl text-xs space-y-1.5 shrink-0 max-w-xs shadow-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Active Resume Connected
              </div>
              <p className="text-slate-100 font-bold truncate">{profile.activeResumeName}</p>
              <p className="text-slate-400 text-[11px]">
                Target: <span className="text-violet-300 font-medium">{profile.targetRole || "Software Engineer"}</span>
              </p>
              <Link href="/resumes" className="text-violet-400 hover:text-violet-300 font-semibold text-[11px] block pt-1 hover:underline">
                Change Resume &rarr;
              </Link>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl text-xs space-y-2 shrink-0 max-w-xs">
              <p className="text-slate-300">Upload your resume to get AI-matched job recommendations tailored to your experience.</p>
              <Link
                href="/resumes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                Upload Resume Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => handleTabSwitch("recommended")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "recommended"
                ? "bg-slate-950 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Recommended For You (Resume Match)</span>
          </button>
          
          <button
            onClick={() => handleTabSwitch("search")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "search"
                ? "bg-slate-950 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Search className="h-4 w-4 text-blue-400" />
            <span>Search All Market Jobs</span>
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border px-3.5 py-2.5 rounded-xl shadow-sm cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
        </button>
      </div>

      {/* Search & Comprehensive Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-5 border shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            
            {/* Search inputs row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">
                  Job Role / Title / Keyword
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Full Stack Engineer, React, Data Scientist"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">
                  Target Location / City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, Remote, Delhi-NCR, Mumbai"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
                  Search Jobs
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              
              {/* Job Type Filter */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => {
                    setJobType(e.target.value);
                    fetchJobs({ jobTypeVal: e.target.value });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Job Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Remote">Remote Only</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Experience Level Filter */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => {
                    setExperienceLevel(e.target.value);
                    fetchJobs({ expVal: e.target.value });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Experience Levels</option>
                  <option value="Junior">Junior (0 - 2 yrs)</option>
                  <option value="Mid">Mid Level (2 - 5 yrs)</option>
                  <option value="Senior">Senior (5 - 8 yrs)</option>
                  <option value="Lead">Lead / Executive (8+ yrs)</option>
                </select>
              </div>

              {/* Portal Source Filter */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Job Portal</label>
                <select
                  value={portal}
                  onChange={(e) => {
                    setPortal(e.target.value);
                    fetchJobs({ portalVal: e.target.value });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Portals</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Naukri">Naukri.com</option>
                  <option value="Indeed">Indeed</option>
                  <option value="Glassdoor">Glassdoor</option>
                  <option value="Instahyre">Instahyre</option>
                  <option value="Wellfound">Wellfound / AngelList</option>
                </select>
              </div>

              {/* Minimum ATS Match Score Filter */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Min ATS Match Score</label>
                <select
                  value={minScore}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinScore(val);
                    fetchJobs({ minScoreVal: val });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={0}>All Scores (0%+)</option>
                  <option value={90}>⚡ Top Match (&gt;90%)</option>
                  <option value={80}>✨ High Match (&gt;80%)</option>
                  <option value={70}>Good Match (&gt;70%)</option>
                </select>
              </div>

            </div>

            {/* Reset Filters & Count bar */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Active Filters: <strong className="text-slate-800">{activeTab === "recommended" ? "Resume Auto-Match" : "Market Search"}</strong> • {jobType !== "All" && `Job Type: ${jobType} • `} {experienceLevel !== "All" && `Level: ${experienceLevel} • `} {portal !== "All" && `Portal: ${portal}`}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-violet-600 hover:text-violet-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset All Filters
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Jobs Results Listing */}
      <div className="space-y-4">
        
        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border text-xs">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-violet-600" />
            <span className="font-extrabold text-slate-900">
              {jobs.length} Market Positions Available
            </span>
            {activeTab === "recommended" && profile?.activeResumeName && (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                Matched against {profile.activeResumeName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                const s = e.target.value as "matchScore" | "recent";
                setSortBy(s);
                const sorted = [...jobs];
                if (s === "matchScore") sorted.sort((a, b) => b.matchScore - a.matchScore);
                setJobs(sorted);
              }}
              className="px-2.5 py-1 text-xs font-bold border rounded-lg bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="matchScore">Highest ATS Match Score</option>
              <option value="recent">Most Recent Jobs</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Searching market positions & scoring ATS resume matches...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-extrabold text-slate-900">No jobs match your current search filters.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try resetting your filters or expanding your job title or location search terms.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Reset Search Filters
            </button>
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
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all space-y-4 relative group"
                >
                  {/* Top Row: Title, Company, Portal Badge, ATS Score */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                          {job.portal}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          {job.jobType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {job.experienceLevel} Level
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap font-medium">
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" /> {job.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-extrabold">{job.salary}</span>
                        <span>•</span>
                        <span className="text-slate-400 text-[11px]">{job.postedDate}</span>
                      </div>
                    </div>

                    {/* AI ATS Match Score Badge */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <div className={`flex flex-col items-end px-4 py-2 rounded-2xl border ${
                        isHighMatch
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : isMediumMatch
                          ? "bg-amber-50 border-amber-300 text-amber-900"
                          : "bg-slate-50 border-slate-300 text-slate-800"
                      }`}>
                        <div className="text-[10px] font-black uppercase tracking-wider">AI ATS Match</div>
                        <div className="text-xl font-black">{job.matchScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Match Verdict Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-white text-xs space-y-1 shadow-inner">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" /> AI Resume Match Verdict
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed">{job.aiVerdict}</p>
                  </div>

                  {/* Description Snippet */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>

                  {/* Matched & Missing Skills Pills */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-700 text-[11px]">Matched Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {job.matchedSkills.map((sk, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {job.missingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-amber-800 text-[11px]">Missing Keywords:</span>
                        <div className="flex flex-wrap gap-1">
                          {job.missingSkills.map((sk, idx) => (
                            <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              + {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTailorForJob(job)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Tailor Resume for Job
                      </button>

                      <Link
                        href="/cover-letters"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                      >
                        <Mail className="h-3.5 w-3.5" /> Cover Letter
                      </Link>

                      <button
                        onClick={() => handleSaveToTracker(job)}
                        disabled={isSaved}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                          isSaved
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        {isSaved ? "Saved to Tracker" : "Save to Tracker"}
                      </button>
                    </div>

                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline"
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
