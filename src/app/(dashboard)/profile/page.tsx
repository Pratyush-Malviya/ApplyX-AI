"use me";
"use client";

import { useState, useEffect } from "react";
import {
  getLocalProfile,
  saveLocalProfile,
  getLocalResumes,
  setActiveLocalResume,
  CandidateProfile,
  SavedResume,
} from "@/lib/profile-store";
import {
  User,
  FileText,
  CheckCircle2,
  MapPin,
  Briefcase,
  Sparkles,
  Upload,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    const p = getLocalProfile();
    const r = getLocalResumes();
    setProfile(p);
    setResumes(r);

    setFullName(p.fullName || "Job Seeker");
    setTargetRole(p.targetRole || "Software Engineer");
    setLocation(p.location || "Bengaluru, India");
    setPhone(p.phone || "");
  }, []);

  const handleSaveProfile = () => {
    if (!profile) return;
    const updated = saveLocalProfile({
      fullName,
      targetRole,
      location,
      phone,
    });
    setProfile(updated);
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !profile) return;
    const updatedSkills = [...(profile.skills || []), newSkill.trim()];
    const updated = saveLocalProfile({ skills: updatedSkills });
    setProfile(updated);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!profile) return;
    const updatedSkills = (profile.skills || []).filter((s) => s !== skillToRemove);
    const updated = saveLocalProfile({ skills: updatedSkills });
    setProfile(updated);
  };

  const handleSelectActiveResume = (id: string) => {
    const updatedResume = setActiveLocalResume(id);
    if (updatedResume) {
      setResumes(getLocalResumes());
      setProfile(getLocalProfile());
    }
  };

  if (!profile) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-extrabold shadow-lg ring-2 ring-indigo-400/30">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">{profile.fullName}</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Profile Active
                </span>
              </div>
              <p className="text-sm text-slate-300 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-indigo-400" /> {profile.targetRole}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-indigo-400" /> {profile.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
            >
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Drawer */}
      {isEditing && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Update Candidate Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Job Title</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Main Grid: Active Saved Resume & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Resume Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Active Profile Resume</h2>
              </div>
              <Link
                href="/resumes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Upload className="h-3.5 w-3.5" /> Upload New Resume
              </Link>
            </div>

            {profile.activeResumeName ? (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{profile.activeResumeName}</h4>
                      <p className="text-xs text-gray-500">Selected as primary resume for ATS tailoring</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                </div>

                {profile.activeResumeText && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Resume Preview:</span>
                    <pre className="text-xs text-gray-600 bg-white p-3 rounded-lg border max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
                      {profile.activeResumeText.substring(0, 400)}...
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl space-y-3">
                <p className="text-sm text-gray-500">No active resume saved in your profile yet.</p>
                <Link
                  href="/resumes"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" /> Upload Master Resume
                </Link>
              </div>
            )}
          </div>

          {/* List of Saved Resumes */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Your Saved Resumes History ({resumes.length})</h3>

            {resumes.length === 0 ? (
              <p className="text-xs text-gray-500">Uploaded resumes will be saved here automatically.</p>
            ) : (
              <div className="space-y-3">
                {resumes.map((r) => {
                  const isActive = r.id === profile.activeResumeId || r.isActive;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isActive ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{r.fileName}</h4>
                          <span className="text-[10px] text-gray-500">Uploaded {new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectActiveResume(r.id)}
                            className="text-xs font-semibold text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md border border-blue-200 transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Parsed Profile Skills & Actions */}
        <div className="space-y-6">
          
          {/* Top Extracted Skills */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Candidate Target Skills</h3>
            <p className="text-xs text-gray-500">Parsed from your resume and used to match live scraped jobs.</p>

            <div className="flex flex-wrap gap-1.5">
              {(profile.skills || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-indigo-400 hover:text-indigo-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add skill (e.g. AWS)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                className="flex-1 px-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddSkill}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-black"
              >
                Add
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 border border-slate-800 text-white space-y-4 shadow-lg">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-300">Quick Profile Actions</h3>

            <div className="space-y-2.5">
              <Link
                href="/tailor"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" /> Tailor Resume for JD
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
