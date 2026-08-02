import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";
import { invalidateAdminConfigCache } from "@/lib/ai/admin-config";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const taskType = searchParams.get("task_type");
  let query = supabase.from("ai_model_routes").select("*").order("priority", { ascending: true });
  if (taskType) query = query.eq("task_type", taskType);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from("ai_model_routes")
    .insert({ ...body, created_by: auth.userId, updated_by: auth.userId, publish_status: "draft" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog("ai_model_routes", data.id, "create", null, data, auth.userId, auth.email);
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const body = await request.json();
  // Bulk priority reorder: [{ id, priority }]
  if (Array.isArray(body)) {
    const updates = body as Array<{ id: string; priority: number }>;
    await Promise.all(updates.map(({ id, priority }) =>
      supabase.from("ai_model_routes").update({ priority, updated_by: auth.userId }).eq("id", id)
    ));
    invalidateAdminConfigCache();
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Expected array of { id, priority }" }, { status: 400 });
}
