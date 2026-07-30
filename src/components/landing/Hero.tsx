"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  Star,
  PlayCircle,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 lg:pt-28 lg:pb-32 bg-slate-950">
      {/* Radial Background Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Call To Action */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs sm:text-sm text-indigo-300 backdrop-blur-md shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="font-semibold text-slate-100">ApplyX AI 2.0</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">Boost Interview Callbacks by 3.5x</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Land Your Dream Job{" "}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
                10x Faster
              </span>{" "}
              with AI Resume Tailoring
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Stop sending generic resumes into ATS black holes. ApplyX AI automatically aligns your resume bullet points with job descriptions, generates compelling cover letters, and tracks your job hunt in one click.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-base font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 px-7 py-4 rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Tailor Your Resume Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#interactive-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 px-6 py-4 rounded-xl transition-all"
              >
                <PlayCircle className="h-5 w-5 text-indigo-400" />
                Try Interactive Demo
              </a>
            </div>

            {/* Key Value Checklist */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>95%+ ATS Keyword Pass Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Chrome Extension Auto-Fill</span>
              </div>
            </div>

            {/* Rating & User Count */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 border-t border-slate-800/80">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950 bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                  SK
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950 bg-gradient-to-tr from-blue-500 to-teal-500 text-white font-bold text-xs flex items-center justify-center">
                  AR
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950 bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center">
                  PM
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950 bg-gradient-to-tr from-emerald-500 to-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  +12k
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-bold text-white">4.9/5</span>
                </div>
                <p className="text-xs text-slate-400">
                  Over <span className="text-slate-200 font-medium">12,000+ candidates</span> got hired in 2026
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Card Mockup */}
          <div className="lg:col-span-5 relative">
            {/* Glowing frame wrapper */}
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
              
              {/* Floating Pill Top Right: Match Score */}
              <div className="absolute -top-4 -right-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-emerald-500/40 px-3.5 py-2 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    ATS Match Score
                  </div>
                  <div className="text-sm font-extrabold text-white">96% (High Match)</div>
                </div>
              </div>

              {/* Floating Pill Bottom Left: Generation Time */}
              <div className="absolute -bottom-4 -left-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-indigo-500/40 px-3.5 py-2 shadow-xl shadow-indigo-500/10 backdrop-blur-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                    AI Speed
                  </div>
                  <div className="text-sm font-extrabold text-white">12 Secs Resume Tailor</div>
                </div>
              </div>

              {/* Mock Application Card Content */}
              <div className="space-y-4">
                {/* Header of Mock Dashboard */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-xs font-mono text-slate-400">ApplyX AI Studio</span>
                  </div>
                  <span className="text-xs rounded-full bg-violet-500/20 text-violet-300 px-2.5 py-0.5 font-medium border border-violet-500/30">
                    Live Analyzer
                  </span>
                </div>

                {/* Target Role preview */}
                <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">Senior Software Engineer</h4>
                      <p className="text-xs text-slate-400">Target: TechCorp India • Full-time</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                      +34% Score Jump
                    </span>
                  </div>
                </div>

                {/* Keyword Match Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">JD Keyword Optimization</span>
                    <span className="text-indigo-400">96 / 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 w-[96%]" />
                  </div>
                </div>

                {/* Dynamic AI Suggested Changes */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">AI Tailored Bullet Highlights</div>
                  
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Added JD Skills: Next.js, Microservices, System Architecture
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      &quot;Engineered high-throughput React & Next.js microservices handling 1M+ daily queries...&quot;
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-violet-950/30 border border-violet-800/40 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-violet-300 font-bold text-[11px]">
                      <FileCheck2 className="h-3.5 w-3.5" /> Cover Letter Ready
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      &quot;Enthusiastic to leverage my backend optimization expertise at TechCorp...&quot;
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Company Trust Bar */}
        <div className="mt-20 border-t border-slate-800/80 pt-10">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Candidates using ApplyX AI got hired at top tech companies & fast-growing startups
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">Google</span>
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">Microsoft</span>
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">Amazon</span>
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">Flipkart</span>
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">Swiggy</span>
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">Zomato</span>
            <span className="text-slate-300 font-extrabold text-lg sm:text-xl tracking-tight">TCS</span>
          </div>
        </div>

      </div>
    </section>
  );
}
