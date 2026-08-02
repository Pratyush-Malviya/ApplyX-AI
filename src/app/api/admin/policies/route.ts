import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";
import { invalidateAdminConfigCache } from "@/lib/ai/admin-config";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const { data, error } = await supabase.from("ai_generation_policies").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const body = await request.json();
  const { data, error } = await supabase.from("ai_generation_policies")
    .insert({ ...body, created_by: auth.userId, updated_by: auth.userId, publish_status: "published" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateAdminConfigCache();
  await auditLog("ai_generation_policies", data.id, "create", null, data, auth.userId, auth.email);
  return NextResponse.json({ data }, { status: 201 });
}
