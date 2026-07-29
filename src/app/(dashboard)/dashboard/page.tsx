"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Mail, Briefcase, TrendingUp } from "lucide-react";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { client, loading: supabaseLoading } = useSupabase();
  const { t } = useTranslation();

  useEffect(() => {
    if (supabaseLoading) return;
    if (!client) { setPageLoading(false); return; }
    client.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      setPageLoading(false);
    });
  }, [client, supabaseLoading]);

  if (pageLoading || supabaseLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!client) {
    return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-900">{t("dashboard.configRequired")}</h2><p className="text-gray-500 mt-2">{t("dashboard.configDesc")}</p></div>;
  }

  const stats = [
    { label: t("nav.resumes"), value: "0", icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: t("nav.coverLetters"), value: "0", icon: Mail, color: "text-green-600 bg-green-50" },
    { label: t("nav.applications"), value: "0", icon: Briefcase, color: "text-purple-600 bg-purple-50" },
    { label: "Interviews", value: "0", icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.welcome")} {user?.user_metadata?.full_name || "User"}</h1>
        <p className="text-gray-500 mt-1">{t("dashboard.overview")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}><stat.icon size={24} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/resumes" className="flex items-center gap-3 p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <FileText size={20} className="text-blue-600" />
            <div><p className="font-medium text-gray-900">{t("dashboard.uploadResume")}</p><p className="text-sm text-gray-500">{t("dashboard.uploadResumeDesc")}</p></div>
          </a>
          <a href="/cover-letters" className="flex items-center gap-3 p-4 rounded-lg border hover:border-green-300 hover:bg-green-50 transition-colors">
            <Mail size={20} className="text-green-600" />
            <div><p className="font-medium text-gray-900">{t("dashboard.generateCoverLetter")}</p><p className="text-sm text-gray-500">{t("dashboard.generateCoverLetterDesc")}</p></div>
          </a>
          <a href="/applications" className="flex items-center gap-3 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <Briefcase size={20} className="text-purple-600" />
            <div><p className="font-medium text-gray-900">{t("dashboard.trackApplications")}</p><p className="text-sm text-gray-500">{t("dashboard.trackApplicationsDesc")}</p></div>
          </a>
        </div>
      </div>
    </div>
  );
}