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
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", labelKey: "nav.resumes", icon: FileText },
  { href: "/tailor", label: "Tailor Resume", labelKey: "nav.tailor", icon: Wand2 },
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
    client.auth.getUser().then(({ data: { user } }: any) => {
      setUser(user);
      if (user) {
        setActiveUserId(user.id);
      }
    });
  }, [client, loading]);

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin" ||
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL && user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

  const handleSignOut = async () => {
    setActiveUserId(null);
    clearAllLocalStores();
    if (client) {
      await client.auth.signOut();
    }
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-extrabold text-blue-600 tracking-tight flex items-center gap-1.5">
              ApplyX <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">{locale === "hi" ? "भारत" : "India Job Copilot"}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const displayLabel = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label;
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}>
                  <item.icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                  {displayLabel}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            {isAdmin && (
              <Link href="/admin" onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-50 border border-violet-200">
                <ShieldCheck size={16} />
                Admin Panel
              </Link>
            )}
            <button onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">
              <Languages size={16} />
              {locale === "en" ? "हिन्दी" : "English"}
            </button>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">
              <LogOut size={16} />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}