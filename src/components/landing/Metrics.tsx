import { TrendingUp, Users, Clock, ShieldCheck } from "lucide-react";

export function Metrics() {
  const stats = [
    {
      icon: TrendingUp,
      value: "3.5x",
      label: "More Interview Invites",
      description: "Candidates using ApplyX AI get called for interviews 85% faster.",
    },
    {
      icon: Users,
      value: "12,000+",
      label: "Candidates Hired",
      description: "Engineers, managers & analysts hired at top companies.",
    },
    {
      icon: Clock,
      value: "< 30 Secs",
      label: "Tailor Time",
      description: "Instant AI keyword extraction and resume rewriting.",
    },
    {
      icon: ShieldCheck,
      value: "98%",
      label: "ATS Pass Rate",
      description: "Flawlessly bypass Workday, Greenhouse, Taleo & Lever filters.",
    },
  ];

  return (
    <section className="py-16 bg-slate-900/50 border-y border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-200 mt-1">{stat.label}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
