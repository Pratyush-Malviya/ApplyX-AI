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

  // Fetch before snapshot
  const { data: before } = await supabase.from("ai_prompt_templates").select("*").eq("id", id).single();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const action = body.action as string | undefined;

  if (action === "publish") {
    const { data, error } = await supabase
      .from("ai_prompt_templates")
      .update({ publish_status: "published", updated_by: auth.userId, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    invalidateAdminConfigCache();
    await auditLog("ai_prompt_templates", id, "publish", before, data, auth.userId, auth.email);
    return NextResponse.json({ data });
  }

  if (action === "rollback") {
    // Rollback: set to archived and activate parent version
    const { data, error } = await supabase
      .from("ai_prompt_templates")
      .update({ publish_status: "archived", updated_by: auth.userId, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (before.parent_id) {
      await supabase.from("ai_prompt_templates")
        .update({ publish_status: "published", updated_at: new Date().toISOString() })
        .eq("id", before.parent_id);
    }
    invalidateAdminConfigCache();
    await auditLog("ai_prompt_templates", id, "rollback", before, data, auth.userId, auth.email);
    return NextResponse.json({ data });
  }

  // General update — bump version and save as draft
  const { data, error } = await supabase
    .from("ai_prompt_templates")
    .update({
      ...body,
      action: undefined,
      version: (before.version ?? 1) + 1,
      publish_status: "draft",
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog("ai_prompt_templates", id, "update", before, data, auth.userId, auth.email);
  return NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = await createClient();
  const { data: before } = await supabase.from("ai_prompt_templates").select("*").eq("id", id).single();

  const { error } = await supabase.from("ai_prompt_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateAdminConfigCache();
  await auditLog("ai_prompt_templates", id, "delete", before, null, auth.userId, auth.email);
  return NextResponse.json({ success: true });
}
