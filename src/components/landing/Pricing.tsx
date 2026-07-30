"use me";
"use client";

import { useState } from "react";
import { Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-slate-950 border-t border-slate-800/80 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Invest in Your Career for the Price of a Coffee
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Choose the plan that fits your job hunting pace. No hidden fees. Cancel anytime.
          </p>

          {/* Billing Switch */}
          <div className="pt-4 flex items-center justify-center gap-3 text-sm">
            <span className={`font-semibold ${!annual ? "text-white" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-800 p-0.5 transition-colors"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-transform ${
                  annual ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`font-semibold flex items-center gap-1.5 ${annual ? "text-white" : "text-slate-400"}`}>
              Annual <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">SAVE 30%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Free Tier */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Starter</div>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-4xl font-extrabold tracking-tight">₹0</span>
              <span className="ml-1 text-sm font-semibold text-slate-400">/ forever</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Perfect for trying out basic AI resume tailoring.</p>

            <ul className="mt-8 space-y-3 text-xs sm:text-sm text-slate-300 flex-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>5 AI Resume Tailors per month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Basic ATS Score Gap Analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>2 AI Cover Letters</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Kanban Application Tracker (Up to 10 jobs)</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="w-full inline-flex justify-center items-center gap-2 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl transition-all"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Card 2: Pro Tier (POPULAR) */}
          <div className="relative flex flex-col rounded-2xl border-2 border-indigo-500 bg-slate-900 p-8 shadow-2xl shadow-indigo-500/20 scale-[1.02]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1 text-[11px] font-extrabold text-white tracking-wider uppercase shadow-md flex items-center gap-1">
              <Zap className="h-3 w-3 fill-current" /> Most Popular
            </div>

            <div className="text-sm font-bold uppercase tracking-wider text-indigo-400">Pro Job Seeker</div>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-4xl font-extrabold tracking-tight">
                {annual ? "₹349" : "₹499"}
              </span>
              <span className="ml-1 text-sm font-semibold text-slate-400">/ month</span>
            </div>
            <p className="mt-2 text-xs text-indigo-200">
              For active job seekers who want maximum interview calls.
            </p>

            <ul className="mt-8 space-y-3 text-xs sm:text-sm text-slate-200 flex-1">
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>UNLIMITED AI Resume Tailoring</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>UNLIMITED AI Cover Letter Generation</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Chrome Extension Auto-Fill (LinkedIn, Naukri, Indeed)</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Advanced Hard & Soft Skills Gap Scanner</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Unlimited Kanban Application Tracking</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Export to ATS-Safe PDF & DOCX</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="w-full inline-flex justify-center items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 py-3.5 rounded-xl shadow-lg shadow-indigo-600/40 transition-all hover:scale-[1.02]"
              >
                Upgrade to Pro Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Lifetime Accelerator */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Career Pass</div>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-4xl font-extrabold tracking-tight">₹1,999</span>
              <span className="ml-1 text-sm font-semibold text-slate-400">/ one-time</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Lifetime access with priority feature updates.</p>

            <ul className="mt-8 space-y-3 text-xs sm:text-sm text-slate-300 flex-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Everything in Pro Plan (Lifetime Access)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>1-on-1 AI Interview Q&A Practice</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Salary Negotiation Insights Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Priority 24/7 VIP Customer Support</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="w-full inline-flex justify-center items-center gap-2 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl transition-all"
              >
                Get Lifetime Access
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
