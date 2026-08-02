"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, MessageSquare, GitBranch,
  Settings2, ShieldCheck, FlaskConical, ScrollText, Zap, Menu, X,
  ChevronRight, BarChart3, Bell, ArrowLeft, Lock, KeyRound, ShieldAlert,
  LogOut, RefreshCw, Sparkles, CheckCircle2, Cpu, Globe, Search
} from "lucide-react";

const navSections = [
  {
    title: "AI GOVERNANCE",
    items: [
      { href: "/admin", label: "Overview Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/prompts", label: "Prompt Manager", icon: MessageSquare },
      { href: "/admin/routes", label: "Model Routing", icon: GitBranch },
      { href: "/admin/policies", label: "Output Policy", icon: Settings2 },
      { href: "/admin/agents", label: "Agent Profiles", icon: Zap },
      { href: "/admin/guardrails", label: "Guardrail Rules", icon: ShieldCheck },
      { href: "/admin/testing", label: "AI Testing Lab", icon: FlaskConical },
    ],
  },
  {
    title: "SAAS OPERATIONS",
    items: [
      { href: "/admin/users", label: "User Directory", icon: Users },
      { href: "/admin/payments", label: "Billing & Payments", icon: CreditCard },
      { href: "/admin/announcements", label: "Announcements", icon: Bell },
      { href: "/admin/logs", label: "System Audit Logs", icon: ScrollText },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth State
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      // 1. Check session storage for passcode login
      const sessionAuth = sessionStorage.getItem("applyx_admin_session");
      if (sessionAuth) {
        try {
          const parsed = JSON.parse(sessionAuth);
          setAdminUser(parsed);
          setAuthStatus("authenticated");
          return;
        } catch {}
      }

      // 2. Check Supabase server-side JWT role
      try {
        const res = await fetch("/api/admin/auth/verify");
        const json = await res.json();
        if (json.isAdmin) {
          setAdminUser(json.user);
          setAuthStatus("authenticated");
          sessionStorage.setItem("applyx_admin_session", JSON.stringify(json.user));
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
        setAdminUser(json.user);
        sessionStorage.setItem("applyx_admin_session", JSON.stringify(json.user));
        setAuthStatus("authenticated");
      } else {
        setAuthError(json.error ?? "Invalid Security Passcode");
      }
    } catch {
      setAuthError("Authentication request failed");
    }
    setAuthenticating(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("applyx_admin_session");
    setAuthStatus("unauthenticated");
    setAdminUser(null);
  };

  // 1. Loading state screen
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <ShieldAlert className="absolute h-6 w-6 text-violet-400" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">Verifying Admin Permissions...</p>
      </div>
    );
  }

  // 2. Unauthenticated Gate Lock Screen
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 shadow-2xl shadow-violet-950/40 relative z-10 space-y-6">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30 border border-violet-400/30">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight pt-2">
              ApplyX <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Admin</span> Gate
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Restricted area. Please enter your Admin Master Passcode to access system governance.
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs font-medium animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePasscodeAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter admin passcode..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 text-right">
                Default passcode: <code className="text-violet-400 font-mono">applyx-admin-2026</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={authenticating || !passcode}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {authenticating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Unlock Admin Portal</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Return to Dashboard */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fully Authenticated Admin UI Shell
  return (
    <div className="min-h-screen bg-[#07090e] font-sans text-slate-100 relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-64 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-200 shadow-xl"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#090c14]/90 backdrop-blur-2xl border-r border-slate-800/70 flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand Logo & Status */}
        <div className="p-5 border-b border-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1">
                ApplyX <span className="text-violet-400">Admin</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">PRODUCTION v2.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to User App Link */}
        <div className="px-3 pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-800"
          >
            <ArrowLeft size={13} />
            Back to Candidate App
          </Link>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href) && item.href !== "/admin";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      active
                        ? "bg-gradient-to-r from-violet-600/25 to-indigo-600/15 text-violet-200 border border-violet-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 hover:border hover:border-slate-800"
                    }`}
                  >
                    <item.icon
                      size={16}
                      className={
                        active
                          ? "text-violet-400 shrink-0"
                          : "text-slate-500 group-hover:text-slate-300 shrink-0"
                      }
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight size={12} className="text-violet-400 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer — Admin Session info & Sign out */}
        <div className="p-3 border-t border-slate-800/70 bg-slate-950/40">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{adminUser?.email ?? "admin@applyx.ai"}</p>
                <p className="text-[10px] text-violet-400 font-medium">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Lock Admin Session"
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top Header Bar + Main Content Area */}
      <main className="lg:ml-64 min-h-screen relative z-10 flex flex-col">
        {/* Admin Topbar Header */}
        <header className="h-16 border-b border-slate-800/70 bg-[#07090e]/80 backdrop-blur-xl sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Gateway Operational
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-300">
              <Cpu size={13} className="text-violet-400" />
              Gemini 2.5 Pro Active
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Quick Cache Purge */}
            <button
              onClick={async () => {
                await fetch("/api/admin/cache/purge", { method: "POST" });
                alert("Cache purged successfully!");
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw size={13} className="text-slate-400" />
              <span>Purge Cache</span>
            </button>

            {/* Lock Session */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-300 transition-all cursor-pointer"
            >
              <Lock size={13} />
              <span>Lock Admin</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
