import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status") ?? "all";
  const offset = (page - 1) * limit;

  let query = supabase.from("subscriptions").select("*, profiles(full_name, email)", { count: "exact" });
  if (status !== "all") query = query.eq("status", status);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, limit });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ ...body, created_by: auth.userId })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync plan to profile
  if (body.user_id && body.plan) {
    await supabase.from("profiles").update({
      plan: body.plan,
      plan_expires_at: body.current_period_end ?? null,
    }).eq("id", body.user_id);
  }

  await auditLog("subscriptions", data.id, "create", null, data, auth.userId, auth.email);
  return NextResponse.json({ data }, { status: 201 });
}
