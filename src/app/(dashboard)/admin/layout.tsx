"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, KeyRound, ShieldAlert, ChevronRight, Sparkles } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const sessionAuth = sessionStorage.getItem("applyx_admin_session");
      if (sessionAuth) {
        setAuthStatus("authenticated");
        return;
      }
      try {
        const res = await fetch("/api/admin/auth/verify");
        const json = await res.json();
        if (json.isAdmin) {
          sessionStorage.setItem("applyx_admin_session", JSON.stringify(json.user));
          setAuthStatus("authenticated");
          return;
        }
      } catch {}
      setAuthStatus("unauthenticated");
    }
    checkAuth();
  }, []);

  const handlePasscodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        sessionStorage.setItem("applyx_admin_session", JSON.stringify(json.user));
        setAuthStatus("authenticated");
      } else {
        setAuthError(json.error ?? "Invalid passcode");
      }
    } catch {
      setAuthError("Authentication failed");
    }
    setAuthenticating(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("applyx_admin_session");
    setAuthStatus("unauthenticated");
  };

  // Loading
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  // Gate
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">Admin Access</h1>
            <p className="text-xs text-gray-500">Enter your passcode to continue.</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-xs font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handlePasscodeAuth} className="space-y-3">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-gray-400 text-right">
              Default: <code className="text-violet-600 font-mono">applyx-admin-2026</code>
            </p>
            <button
              type="submit"
              disabled={authenticating || !passcode}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm"
            >
              {authenticating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Unlock <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated shell — minimal, uses the main dashboard sidebar
  return (
    <div className="space-y-0">
      {/* Simple top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <span className="text-lg font-extrabold text-gray-900">Admin Panel</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">SUPER ADMIN</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
        >
          <Lock size={13} /> Lock Session
        </button>
      </div>
      {children}
    </div>
  );
}
