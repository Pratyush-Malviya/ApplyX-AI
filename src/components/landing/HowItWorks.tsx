import { Upload, FileSearch, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "Upload Your Master Resume",
      description: "Import your current resume in PDF or DOCX format. ApplyX AI parses your skills, work history, and achievements.",
    },
    {
      step: "02",
      icon: FileSearch,
      title: "Paste Job Description",
      description: "Paste the URL or text of any job posting from LinkedIn, Naukri, Indeed, or company career portals.",
    },
    {
      step: "03",
      icon: Sparkles,
      title: "AI Optimizes & Tailors",
      description: "Our AI model injects high-impact JD keywords, restructures bullet points, and generates a matched cover letter.",
    },
    {
      step: "04",
      icon: CheckCircle2,
      title: "Apply & Track Callbacks",
      description: "Download your 95%+ ATS score resume, apply with confidence, and manage your pipeline to job offer stage.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-900/40 border-t border-slate-800/80 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3.5 py-1.5 text-xs font-semibold text-violet-300">
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How ApplyX AI Works in Under 60 Seconds
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Turn hours of tedious manual application tweaking into an instant automated workflow.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] shadow-xl"
              >
                {/* Step badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-extrabold text-violet-400 font-mono tracking-wider bg-violet-950/80 border border-violet-800 px-2.5 py-1 rounded-md">
                    STEP {s.step}
                  </span>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to action bar */}
        <div className="mt-14 text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Start Free Trial Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
