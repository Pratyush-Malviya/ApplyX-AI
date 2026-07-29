"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { useTranslation } from "@/lib/i18n";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { client } = useSupabase();
  const { t } = useTranslation();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) { setError("Supabase not configured"); return; }
    setLoading(true); setError(null);
    const { error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t("app.name")}</h1>
          <p className="mt-2 text-gray-600">{t("auth.signUp")}</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t("auth.fullName")}</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t("auth.email")}</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t("auth.password")}</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          {t("auth.hasAccount")} <a href="/auth/login" className="text-blue-600 hover:underline">{t("auth.signInLink")}</a>
        </p>
      </div>
    </div>
  );
}