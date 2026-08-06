"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";
import { setActiveUserId, clearAllLocalStores } from "@/lib/profile-store";
import {
  LayoutDashboard,
  FileText,
  Mail,
  LogOut,
  Menu,
  X,
  Wand2,
  Search,
  Languages,
  Sparkles,
  User,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", labelKey: "nav.resumes", icon: FileText },
  { href: "/tailor", label: "Tailor Resume", labelKey: "nav.tailor", icon: Wand2, highlight: true },
  { href: "/cover-letters", label: "Cover Letters", labelKey: "nav.coverLetters", icon: Mail },
  { href: "/analyze", label: "ATS Matcher", labelKey: "nav.analyze", icon: Search },
  { href: "/profile", label: "My Profile", labelKey: "nav.profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { client, loading } = useSupabase();
  const { t, locale, toggleLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (loading || !client) return;
    client.auth.getUser().then(({ data: { user }, error }: any) => {
      if (error || !user) {
        client.auth.signOut().catch(() => {});
        setUser(null);
        return;
      }
      setUser(user);
      setActiveUserId(user.id);
    });
  }, [client, loading]);

  const handleSignOut = async () => {
    setActiveUserId(null);
    clearAllLocalStores();
    if (client) {
      await client.auth.signOut();
    }
    router.push("/auth/login");
    router.refresh();
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "C";

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans antialiased text-slate-900 selection:bg-violet-500 selection:text-white">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 text-slate-700 hover:text-blue-600 transition-all cursor-pointer"
        aria-label="Toggle Navigation"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sleek Candidate Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-sm transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col justify-between`}
      >
        <div>
          {/* Header Branding */}
          <div className="p-6 border-b border-slate-100/80">
            <Link href="/dashboard" className="group flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-all">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                    ApplyX <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">
                    {locale === "hi" ? "भारत जॉब असिस्टेंट" : "India Job Copilot"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/80">
                PRO
              </span>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Candidate Tools
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const displayLabel = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-500/25 scale-[1.01]"
                      : item.highlight
                      ? "text-violet-700 bg-violet-50/70 hover:bg-violet-100/80 border border-violet-200/60 font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? "text-white" : item.highlight ? "text-violet-600" : "text-slate-400"} />
                    <span>{displayLabel}</span>
                  </div>
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {user && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-xs"
            >
              <Languages size={14} className="text-slate-400" />
              {locale === "en" ? "हिन्दी" : "English"}
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-all cursor-pointer shadow-xs"
            >
              <LogOut size={14} />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Candidate Application Container */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}