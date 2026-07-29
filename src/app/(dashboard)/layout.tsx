"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  FileText,
  Mail,
  Briefcase,
  LogOut,
  Menu,
  X,
  Wand2,
  Search,
  Languages,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/resumes", labelKey: "nav.resumes", icon: FileText },
  { href: "/tailor", labelKey: "nav.tailor", icon: Wand2 },
  { href: "/cover-letters", labelKey: "nav.coverLetters", icon: Mail },
  { href: "/analyze", labelKey: "nav.analyze", icon: Search },
  { href: "/applications", labelKey: "nav.applications", icon: Briefcase },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { client } = useSupabase();
  const { t, locale, toggleLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-blue-600">{t("app.name")}</h1>
            <p className="text-sm text-gray-500 mt-1">{locale === "hi" ? "भारत" : "India"}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}>
                  <item.icon size={18} />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            <button onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              <Languages size={18} />
              {locale === "en" ? "हिन्दी" : "English"}
            </button>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              <LogOut size={18} />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}