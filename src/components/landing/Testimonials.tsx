import { Star, Quote, Sparkles } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      name: "Aarav Mehta",
      role: "Senior Frontend Engineer",
      company: "Swiggy",
      package: "₹34 LPA Offer",
      avatar: "AM",
      text: "I spent 3 weeks sending generic resumes with zero callbacks. After using ApplyX AI to match my keywords with job descriptions, I got 5 interview calls within 7 days!",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Product Manager",
      company: "Cred",
      package: "₹28 LPA Offer",
      avatar: "PS",
      text: "The cover letter generator saves me 20 minutes per application. The tone options are spot on, and hiring managers explicitly complimented my tailored pitch.",
      rating: 5,
    },
    {
      name: "Rohan Verma",
      role: "Backend & Cloud Engineer",
      company: "Flipkart",
      package: "₹32 LPA Offer",
      avatar: "RV",
      text: "The Chrome extension + ATS resume tailor is the ultimate combination. Auto-filling on LinkedIn and Naukri made applying to 10 jobs per day effortless.",
      rating: 5,
    },
    {
      name: "Ananya Iyer",
      role: "Data Scientist",
      company: "TCS Innovation Labs",
      package: "₹22 LPA Offer",
      avatar: "AI",
      text: "Passed Workday ATS filters for the first time without getting automatically rejected. ApplyX AI highlighted hard skills I didn't even realize were missing.",
      rating: 5,
    },
    {
      name: "Karan Patel",
      role: "DevOps / SRE Lead",
      company: "Tech Startups",
      package: "₹26 LPA Offer",
      avatar: "KP",
      text: "The Kanban application tracker kept my entire pipeline organized. From application submitted to final offer letter, everything was seamless.",
      rating: 5,
    },
    {
      name: "Neha Gupta",
      role: "QA Automation Engineer",
      company: "InfoTech",
      package: "₹18 LPA Offer",
      avatar: "NG",
      text: "Super clean UI and lightning-fast AI generation. Highly recommended for anyone actively looking for a job in the current competitive market!",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-900/40 border-t border-slate-800/80 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3.5 py-1.5 text-xs font-semibold text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Loved by 12,000+ Job Seekers Across India & Abroad
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Read how ApplyX AI helped candidates bypass ATS algorithms and secure high-paying job offers.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between p-7 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.01] shadow-xl relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-slate-800 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                {/* Rating stars */}
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed italic">
                  &quot;{rev.text}&quot;
                </p>
              </div>

              {/* Author info */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {rev.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{rev.name}</h4>
                    <p className="text-xs text-slate-400">{rev.role} • {rev.company}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  {rev.package}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
