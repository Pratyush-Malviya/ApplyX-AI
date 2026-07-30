"use me";
"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Sliders,
  FileText,
  Send,
  Kanban,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<"tailor" | "cover" | "kanban">("tailor");
  
  // Tab 1 state
  const [selectedRole, setSelectedRole] = useState<"frontend" | "backend" | "pm">("frontend");
  const [optimized, setOptimized] = useState(true);

  // Tab 2 state
  const [tone, setTone] = useState<"confident" | "executive" | "startup">("confident");

  const roles = {
    frontend: {
      title: "Senior Frontend Engineer (React/Next.js)",
      company: "InnovateTech",
      originalScore: 54,
      tailoredScore: 95,
      missingKeywords: ["Server Components", "Tailwind CSS", "Zustand", "Performance Optimization"],
      originalBullet: "Built web components for company website using JavaScript and CSS.",
      tailoredBullet: "Engineered scalable Next.js 15 web applications with React Server Components, Tailwind CSS, and Zustand state management—improving PageSpeed score by 42%.",
    },
    backend: {
      title: "Backend Engineer (Node.js & Cloud)",
      company: "DataCloud Global",
      originalScore: 61,
      tailoredScore: 97,
      missingKeywords: ["Microservices", "PostgreSQL", "Redis Caching", "Docker"],
      originalBullet: "Maintained backend server API endpoints and connected database.",
      tailoredBullet: "Architected high-throughput Node.js microservices backed by PostgreSQL and Redis caching, deploying Dockerized services with 99.99% uptime.",
    },
    pm: {
      title: "Technical Product Manager",
      company: "FinTech ScaleUp",
      originalScore: 48,
      tailoredScore: 92,
      missingKeywords: ["Product Roadmap", "A/B Testing", "Agile Sprints", "User Retention"],
      originalBullet: "Talked with developers and managed product launch dates.",
      tailoredBullet: "Spearheaded quarterly product roadmaps and cross-functional Agile sprints, executing A/B testing frameworks that drove a 28% surge in user retention.",
    },
  };

  const currentRoleData = roles[selectedRole];

  return (
    <section id="interactive-demo" className="py-20 lg:py-28 bg-slate-950 border-t border-slate-800/80 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3.5 py-1.5 text-xs font-semibold text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See ApplyX AI in Action Before You Sign Up
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Test how our AI transforms standard resumes, crafts custom cover letters, and organizes your job search pipeline.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-900 p-1.5 border border-slate-800">
            <button
              onClick={() => setActiveTab("tailor")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "tailor"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="h-4 w-4" />
              1. ATS Resume Tailor
            </button>
            <button
              onClick={() => setActiveTab("cover")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "cover"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              2. Cover Letter Writer
            </button>
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "kanban"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban className="h-4 w-4" />
              3. Application Tracker
            </button>
          </div>
        </div>

        {/* Tab Content Box */}
        <div className="mt-8 mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
          
          {/* TAB 1: ATS Resume Tailor */}
          {activeTab === "tailor" && (
            <div className="space-y-6">
              
              {/* Role Switcher & Optimize Toggle */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Select Sample Role:</span>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setSelectedRole("frontend")}
                      className={`px-3 py-1 text-xs font-semibold rounded ${
                        selectedRole === "frontend"
                          ? "bg-violet-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Frontend Dev
                    </button>
                    <button
                      onClick={() => setSelectedRole("backend")}
                      className={`px-3 py-1 text-xs font-semibold rounded ${
                        selectedRole === "backend"
                          ? "bg-violet-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Backend Dev
                    </button>
                    <button
                      onClick={() => setSelectedRole("pm")}
                      className={`px-3 py-1 text-xs font-semibold rounded ${
                        selectedRole === "pm"
                          ? "bg-violet-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Product Mgr
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setOptimized(!optimized)}
                  className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300 hover:bg-indigo-900 transition-colors"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Toggle AI Optimization: {optimized ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              {/* Job Title & Score Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="md:col-span-2 space-y-1">
                  <div className="text-xs uppercase tracking-wider font-bold text-violet-400">
                    Target Role Analysis
                  </div>
                  <h3 className="text-lg font-extrabold text-white">{currentRoleData.title}</h3>
                  <p className="text-xs text-slate-400">Company: {currentRoleData.company}</p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold mb-1">ATS Compatibility</span>
                  <div className="text-3xl font-extrabold flex items-baseline gap-1">
                    <span className={optimized ? "text-emerald-400" : "text-amber-400"}>
                      {optimized ? currentRoleData.tailoredScore : currentRoleData.originalScore}%
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded ${
                    optimized ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                  }`}>
                    {optimized ? "HIGH INTERVIEW CHANCE" : "NEEDS KEYWORD MATCH"}
                  </span>
                </div>
              </div>

              {/* Bullet point comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Bullet */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="h-4 w-4" /> Before (Generic Resume)
                    </span>
                    <span>ATS Score: {currentRoleData.originalScore}%</span>
                  </div>
                  <p className="text-sm text-slate-300 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
                    &quot;{currentRoleData.originalBullet}&quot;
                  </p>
                </div>

                {/* AI Tailored Bullet */}
                <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-800/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle className="h-4 w-4" /> After (ApplyX AI Tailored)
                    </span>
                    <span className="text-emerald-400">ATS Score: {currentRoleData.tailoredScore}%</span>
                  </div>
                  <p className="text-sm text-slate-100 font-mono bg-slate-900/90 p-3 rounded-lg border border-indigo-500/30">
                    &quot;{currentRoleData.tailoredBullet}&quot;
                  </p>
                </div>
              </div>

              {/* Missing keywords injected */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-300">
                  Target Keywords Injected Automatically by AI:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentRoleData.missingKeywords.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                      <Check className="h-3 w-3" /> {kw}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Cover Letter Generator */}
          {activeTab === "cover" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">Select Writing Tone:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTone("confident")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tone === "confident"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-950 text-slate-400 border border-slate-800"
                    }`}
                  >
                    Confident & Professional
                  </button>
                  <button
                    onClick={() => setTone("executive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tone === "executive"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-950 text-slate-400 border border-slate-800"
                    }`}
                  >
                    Executive
                  </button>
                  <button
                    onClick={() => setTone("startup")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tone === "startup"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-950 text-slate-400 border border-slate-800"
                    }`}
                  >
                    Startup / High Impact
                  </button>
                </div>
              </div>

              {/* Cover Letter Document Preview */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-slate-200 text-sm font-sans">
                <div className="text-xs font-mono text-indigo-400 border-b border-slate-800 pb-2 flex justify-between items-center">
                  <span>To: Hiring Team at TechCorp India</span>
                  <span className="text-slate-500">Generated in 4 seconds</span>
                </div>
                <p className="leading-relaxed">
                  Dear Hiring Team,
                </p>
                <p className="leading-relaxed">
                  {tone === "confident" && (
                    "I am writing to express my strong enthusiasm for the Senior Software Engineer position at TechCorp India. Having scaled backend microservices to handle over 1,000,000 requests per day, my technical stack directly mirrors your requirement for robust systems design and API optimization."
                  )}
                  {tone === "executive" && (
                    "I am pleased to submit my application for the Senior Engineering leadership role at TechCorp. Over the past 6+ years, I have spearheaded cross-functional engineering teams, delivering mission-critical applications on time while reducing infrastructure overhead by 30%."
                  )}
                  {tone === "startup" && (
                    "I’m thrilled to apply for the Engineering team at TechCorp. As someone who thrives in high-velocity product environments, I love taking complex requirements and turning them into sleek, resilient code that customers love."
                  )}
                </p>
                <p className="leading-relaxed">
                  I look forward to discussing how my experience with scalable architecture can contribute directly to TechCorp&apos;s upcoming product launch.
                </p>
                <div className="pt-2 text-slate-400 text-xs font-mono">
                  Sincerely,<br />
                  <span className="text-white font-bold">Rahul Sharma</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Kanban Application Tracker */}
          {activeTab === "kanban" && (
            <div className="space-y-6">
              <div className="text-xs font-bold text-slate-300">
                Live Job Search Pipeline Dashboard
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Column 1 */}
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>Saved Jobs</span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">4</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-white">Full Stack Engineer</div>
                    <div className="text-slate-400">Razorpay • Bengaluru</div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-blue-400">
                    <span>Applied</span>
                    <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded">12</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-white">Frontend Lead</div>
                    <div className="text-slate-400">Cred • Remote</div>
                    <span className="inline-block text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded">
                      Tailored Resume Sent
                    </span>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                    <span>Interviewing</span>
                    <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded">3</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs space-y-1">
                    <div className="font-bold text-white">Staff Software Engineer</div>
                    <div className="text-slate-400">Swiggy • Round 2</div>
                    <span className="inline-block text-[10px] text-indigo-300 font-semibold bg-indigo-950 px-1.5 py-0.5 rounded">
                      Interview Scheduled
                    </span>
                  </div>
                </div>

                {/* Column 4 */}
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                    <span>Offers</span>
                    <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">2</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-xs space-y-1">
                    <div className="font-bold text-white">Senior SDE</div>
                    <div className="text-slate-300">Flipkart • ₹32 LPA</div>
                    <span className="inline-block text-[10px] text-emerald-300 font-bold bg-emerald-900 px-1.5 py-0.5 rounded">
                      Offer Received 🎉
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
