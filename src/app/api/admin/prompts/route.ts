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
  const status = searchParams.get("status") ?? "all";

  let query = supabase.from("ai_prompt_templates").select("*").order("created_at", { ascending: false });
  if (taskType) query = query.eq("task_type", taskType);
  if (status !== "all") query = query.eq("publish_status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const supabase = await createClient();
  const body = await request.json();
  const { name, prompt_type, task_type, segment, content, variables, environment, description, tags } = body;

  if (!name || !prompt_type || !content) {
    return NextResponse.json({ error: "name, prompt_type, and content are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_prompt_templates")
    .insert({
      name, prompt_type, task_type: task_type ?? "general",
      segment: segment ?? "all", content,
      variables: variables ?? [], environment: environment ?? "production",
      description, tags: tags ?? [],
      created_by: auth.userId, updated_by: auth.userId,
      publish_status: "draft", version: 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog("ai_prompt_templates", data.id, "create", null, data, auth.userId, auth.email);
  return NextResponse.json({ data }, { status: 201 });
}
