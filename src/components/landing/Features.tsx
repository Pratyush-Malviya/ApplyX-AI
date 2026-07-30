import {
  Target,
  Zap,
  FileCheck,
  Chrome,
  Kanban,
  FileDown,
  Sparkles,
} from "lucide-react";

export function Features() {
  const featureList = [
    {
      icon: Target,
      title: "ATS Keyword Gap Analysis",
      description:
        "Instantly scans job descriptions to reveal exact hard skills, certifications, and technical terms missing from your resume.",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: Zap,
      title: "1-Click AI Resume Tailor",
      description:
        "Rewrites work experience bullet points with strong action verbs and quantified impact metrics customized for each job.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: FileCheck,
      title: "Tailored Cover Letter Writer",
      description:
        "Generates compelling, customized cover letters matching your background to the company's specific mission and requirements.",
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      icon: Chrome,
      title: "Browser Extension Auto-Fill",
      description:
        "Clip jobs directly from LinkedIn, Naukri, Glassdoor, or Indeed and auto-fill applications effortlessly.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Kanban,
      title: "Smart Application Tracker",
      description:
        "Kanban dashboard to organize saved positions, submitted applications, interview schedules, and job offers.",
      gradient: "from-amber-500 to-rose-500",
    },
    {
      icon: FileDown,
      title: "ATS-Safe PDF & DOCX Export",
      description:
        "Export clean, beautifully structured resumes formatted to pass through Workday, Taleo, and Greenhouse ATS screeners.",
      gradient: "from-purple-500 to-indigo-600",
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-950 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Complete Job Search Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything You Need to Win Interviews
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Stop applying with one static resume. Power your entire job hunt with AI tools designed specifically for job seekers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-7 hover:border-slate-700 hover:bg-slate-900 transition-all hover:scale-[1.01] shadow-xl overflow-hidden"
              >
                {/* Glow accent */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}
                />

                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-5 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-extrabold text-white mb-2.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
