import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-16 lg:py-24 bg-slate-950 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="relative rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 p-8 sm:p-12 lg:p-16 border border-violet-500/30 shadow-2xl overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Background glow effects */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-950/60 px-3 py-1 text-xs font-semibold text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ready to Stop Getting Ghosted?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Start Landing More Interviews Today
            </h2>
            <p className="text-slate-200 text-base sm:text-lg">
              Join 12,000+ candidates who transformed their job search with ApplyX AI. Free to get started, no credit card required.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>5 Free Monthly Tailors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="relative z-10 shrink-0">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2.5 text-base font-bold text-slate-950 bg-white hover:bg-slate-100 px-8 py-4 rounded-xl shadow-xl hover:scale-105 transition-all"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
