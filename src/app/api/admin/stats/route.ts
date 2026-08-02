import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

  const [
    totalUsersRes,
    newUsersRes,
    proUsersRes,
    aiCallsRes,
    revenueRes,
    cacheHitRes,
    errorRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    supabase.from("ai_usage_logs").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("payment_transactions").select("amount").eq("status", "success").gte("created_at", since),
    supabase.from("ai_usage_logs").select("id", { count: "exact", head: true }).eq("cached", true).gte("created_at", since),
    supabase.from("ai_usage_logs").select("id", { count: "exact", head: true }).eq("success", false).gte("created_at", since),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0);
  const totalCalls = aiCallsRes.count ?? 0;
  const cachedCalls = cacheHitRes.count ?? 0;
  const cacheHitRate = totalCalls > 0 ? Math.round((cachedCalls / totalCalls) * 100) : 0;

  return NextResponse.json({
    totalUsers: totalUsersRes.count ?? 0,
    newUsers: newUsersRes.count ?? 0,
    proUsers: proUsersRes.count ?? 0,
    aiCalls: totalCalls,
    cachedCalls,
    cacheHitRate,
    errors: errorRes.count ?? 0,
    revenueInr: totalRevenue,
    days,
  });
}
