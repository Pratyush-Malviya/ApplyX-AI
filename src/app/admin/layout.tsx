"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Users,
  MessageSquare,
  GitBranch,
  FlaskConical,
  ShieldCheck,
  ScrollText,
  CreditCard,
  Megaphone,
  Bot,
  Lock,
  KeyRound,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Admin Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Directory", icon: Users },
  { href: "/admin/prompts", label: "Prompt Manager", icon: MessageSquare },
  { href: "/admin/routes", label: "Model Routing", icon: GitBranch },
  { href: "/admin/testing", label: "AI Testing Lab", icon: FlaskConical },
  { href: "/admin/guardrails", label: "Safety Guardrails", icon: ShieldCheck },
  { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/payments", label: "Payments & SaaS", icon: CreditCard },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/agents", label: "Subagent Fleet", icon: Bot },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  // Gate
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-600/30">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Admin Security Access</h1>
            <p className="text-xs text-slate-400">Enter your master passcode to unlock Admin Console.</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handlePasscodeAuth} className="space-y-3">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 text-right">
              Default: <code className="text-violet-400 font-mono">applyx-admin-2026</code>
            </p>
            <button
              type="submit"
              disabled={authenticating || !passcode}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm shadow-lg shadow-violet-600/30 cursor-pointer"
            >
              {authenticating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Unlock Console <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Exit to Candidate User App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Admin Dashboard Layout with Dedicated Admin Sidebar
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-900 text-white shadow-lg"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Dedicated Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 text-slate-300 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col justify-between`}
      >
        <div>
          {/* Header Branding */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-400" />
                ApplyX <span className="text-violet-400 font-black">ADMIN</span>
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SaaS Operations & AI Gateway</p>
          </div>

          {/* Admin Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              System Management
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={14} className="text-violet-400" /> Candidate App
            </span>
            <span className="text-[10px] font-bold text-slate-500">User Mode</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2.5 w-full rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all"
          >
            <Lock size={14} />
            Lock Admin Console
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
