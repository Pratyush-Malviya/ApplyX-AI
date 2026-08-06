"use client";

import { useState } from "react";
import { Zap, ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, Play, Filter, Building2, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";

interface JobQueueItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  status: "pending" | "approved" | "submitted" | "skipped";
  jobUrl: string;
}

export default function AutoApplyPage() {
  const [targetRole, setTargetRole] = useState("Senior Frontend Engineer");
  const [targetLocation, setTargetLocation] = useState("Bengaluru / Remote");
  const [minSalary, setMinSalary] = useState("₹25 - 35 LPA");

  const [queue, setQueue] = useState<JobQueueItem[]>([
    {
      id: "1",
      jobTitle: "Senior Frontend Engineer (React/Next.js)",
      company: "Zomato",
      location: "Gurugram / Remote",
      salary: "₹30 - 42 LPA",
      matchScore: 94,
      status: "pending",
      jobUrl: "https://www.linkedin.com/jobs/view/1001",
    },
    {
      id: "2",
      jobTitle: "Full Stack Engineer (TypeScript & Node)",
      company: "Swiggy",
      location: "Bengaluru",
      salary: "₹28 - 38 LPA",
      matchScore: 89,
      status: "pending",
      jobUrl: "https://www.naukri.com/job-listings-2002",
    },
    {
      id: "3",
      jobTitle: "Staff Software Engineer - UI Systems",
      company: "Razorpay",
      location: "Bengaluru / Hybrid",
      salary: "₹35 - 50 LPA",
      matchScore: 96,
      status: "pending",
      jobUrl: "https://www.glassdoor.com/job-listing-3003",
    },
  ]);

  const [approvedCount, setApprovedCount] = useState(0);

  const handleApprove = (id: string) => {
    if (approvedCount >= 10) {
      alert("Safety Guardrail Active: Maximum 10 Auto-Apply approvals per day permitted to protect user reputation.");
      return;
    }
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );
    setApprovedCount((c) => c + 1);
  };

  const handleSkip = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "skipped" } : item))
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-block mb-2">
            ⭐ Biggest Differentiator — Human-in-the-Loop Batch Queue
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="h-7 w-7 text-blue-600" /> &quot;Auto-Apply&quot; Mode
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            ApplyX discovers matching jobs, pre-tailors resumes & cover letters, and waits for your 1-click safety approval.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Safety Guardrail Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold">Safety & Reputation Guardrail Active:</strong> Applications are never submitted blindly without your explicit approval. Daily cap: 10 auto-applies/day ({approvedCount}/10 used today).
        </div>
      </div>

      {/* Preferences Filter Card */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-blue-600" /> Target Filter Criteria
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">Location</label>
            <input
              type="text"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">Target Salary CTC</label>
            <input
              type="text"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-gray-900">
          Discovered Job Queue ({queue.length} Matches Found)
        </h2>

        <div className="space-y-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-300 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {item.matchScore}% Match
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900">{item.jobTitle}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1 font-bold text-gray-800">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" /> {item.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" /> {item.location}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <DollarSign className="h-3.5 w-3.5" /> {item.salary}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleSkip(item.id)}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve & Queue
                    </button>
                  </>
                )}

                {item.status === "approved" && (
                  <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approved — Extension Sync Ready
                  </span>
                )}

                {item.status === "skipped" && (
                  <span className="px-3.5 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl">
                    Skipped
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
