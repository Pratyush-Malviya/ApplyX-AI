"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, MessageSquare, GitBranch,
  Settings2, ShieldCheck, FlaskConical, ScrollText, Zap, Menu, X,
  ChevronRight, BarChart3, Bell, ArrowLeft
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/prompts", label: "Prompt Manager", icon: MessageSquare },
  { href: "/admin/routes", label: "Model Routing", icon: GitBranch },
  { href: "/admin/policies", label: "Output Policy", icon: Settings2 },
  { href: "/admin/agents", label: "Agent Profiles", icon: Zap },
  { href: "/admin/guardrails", label: "Guardrails", icon: ShieldCheck },
  { href: "/admin/testing", label: "AI Testing Lab", icon: FlaskConical },
  { href: "/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d0f14] font-sans text-white">
      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800/80 backdrop-blur border border-slate-700"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d0f14] border-r border-slate-800/60 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">ApplyX Admin</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5 font-semibold tracking-wide">ADMIN PANEL</span>
          </div>
        </div>

        {/* Back to App */}
        <div className="px-3 pt-3">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors">
            <ArrowLeft size={13} />
            Back to App
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/admin";
            const isExactActive = pathname === item.href;
            const active = item.exact ? isExactActive : isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <item.icon size={16} className={active ? "text-violet-400" : "text-slate-600 group-hover:text-slate-400"} />
                {item.label}
                {active && <ChevronRight size={12} className="ml-auto text-violet-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800/60 text-[10px] text-slate-600 px-4">
          Admin access only
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">{children}</div>
      </main>
    </div>
  );
}
