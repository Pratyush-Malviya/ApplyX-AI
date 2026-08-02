import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { data, error } = await supabase.from("ai_guardrail_rules").update({ ...body, updated_by: auth.userId, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog("ai_guardrail_rules", id, "update", null, data, auth.userId, auth.email);
  return NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("ai_guardrail_rules").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog("ai_guardrail_rules", id, "delete", null, null, auth.userId, auth.email);
  return NextResponse.json({ success: true });
}
