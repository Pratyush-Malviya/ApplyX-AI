import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";
import { invalidateAdminConfigCache } from "@/lib/ai/admin-config";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { data: before } = await supabase.from("ai_model_routes").select("*").eq("id", id).single();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.action === "publish") {
    const { data, error } = await supabase.from("ai_model_routes")
      .update({ publish_status: "published", updated_by: auth.userId, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    invalidateAdminConfigCache();
    await auditLog("ai_model_routes", id, "publish", before, data, auth.userId, auth.email);
    return NextResponse.json({ data });
  }
  const { data, error } = await supabase.from("ai_model_routes")
    .update({ ...body, updated_by: auth.userId, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateAdminConfigCache();
  await auditLog("ai_model_routes", id, "update", before, data, auth.userId, auth.email);
  return NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const supabase = await createClient();
  const { data: before } = await supabase.from("ai_model_routes").select("*").eq("id", id).single();
  const { error } = await supabase.from("ai_model_routes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateAdminConfigCache();
  await auditLog("ai_model_routes", id, "delete", before, null, auth.userId, auth.email);
  return NextResponse.json({ success: true });
}
