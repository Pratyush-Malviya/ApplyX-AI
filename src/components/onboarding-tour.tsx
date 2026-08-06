"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, FileText, Wand2, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Step 1: Upload Your Master Resume",
      desc: "Drag and drop your PDF or DOCX resume. ApplyX will automatically extract your work history, skills, and contact details into your active profile store.",
      icon: FileText,
      badge: "Fast 3-Second Parse",
      ctaText: "Go to Resumes",
      ctaLink: "/resumes",
    },
    {
      title: "Step 2: Tailor for Any Job Posting",
      desc: "Paste a target Job Description. Our multi-model AI gateway (Gemini 2.5 Pro + DeepSeek + Qwen3) rewrites your bullets with ATS keywords and STAR impact metrics.",
      icon: Wand2,
      badge: "ATS Keyword Optimization",
      ctaText: "Try AI Tailor",
      ctaLink: "/tailor",
    },
    {
      title: "Step 3: Track & Autofill in 1 Click",
      desc: "Use our Chrome Extension to auto-detect and fill portal application forms. Keep track of your applications from Saved → Applied → Interview → Offer on your Kanban board.",
      icon: CheckCircle2,
      badge: "Automated Workflow",
      ctaText: "Explore Tracker",
      ctaLink: "/applications",
    },
  ];

  const current = steps[step - 1];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step Counter Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Quick Start Tour • Step {step} of 3
          </span>
          <span className="text-xs text-gray-400 font-medium">({current.badge})</span>
        </div>

        {/* Step Visual Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Icon className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">{current.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{current.desc}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-gray-500">
            <span>Setup Progress</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={current.ctaLink}
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                {current.ctaText} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
