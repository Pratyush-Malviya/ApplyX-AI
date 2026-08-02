import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const supabase = await createClient();

  const [profileRes, subsRes, txRes, usageRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("payment_transactions").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("ai_usage_logs").select("created_at,task_type,provider,cached,tokens_used,latency_ms,success").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (profileRes.error) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    profile: profileRes.data,
    subscriptions: subsRes.data ?? [],
    transactions: txRes.data ?? [],
    recentUsage: usageRes.data ?? [],
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data: before } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Allowed update fields for admin
  const allowed = ["full_name", "role", "plan", "plan_expires_at", "status", "notes", "ai_calls_limit"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog("profiles", id, "update", before, data, auth.userId, auth.email);
  return NextResponse.json({ data });
}
