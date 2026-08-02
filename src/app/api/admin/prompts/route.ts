import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";
import { invalidateAdminConfigCache } from "@/lib/ai/admin-config";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompt-builder";

// Auto-seed default prompts if the table is empty
async function seedDefaultPromptsIfEmpty(supabase: any, userId: string) {
  try {
    const { count } = await supabase.from("ai_prompt_templates").select("id", { count: "exact", head: true });
    if (count === 0) {
      const defaults = [
        {
          name: "Executive ATS Resume System Prompt",
          prompt_type: "system",
          task_type: "resume",
          segment: "all",
          content: SYSTEM_PROMPTS.resume,
          variables: ["user_name", "target_title", "job_description"],
          publish_status: "published",
          version: 1,
          environment: "production",
          description: "Default system prompt for ATS resume optimization & STAR bullet points",
          created_by: userId,
          updated_by: userId,
        },
        {
          name: "Persuasive Cover Letter Writer Prompt",
          prompt_type: "system",
          task_type: "cover-letter",
          segment: "all",
          content: SYSTEM_PROMPTS["cover-letter"],
          variables: ["user_name", "company_name", "role_title"],
          publish_status: "published",
          version: 1,
          environment: "production",
          description: "Default system prompt for tailored 250-350 word cover letters",
          created_by: userId,
          updated_by: userId,
        },
        {
          name: "ATS Matcher & JD Analyzer System Prompt",
          prompt_type: "system",
          task_type: "analyze",
          segment: "all",
          content: SYSTEM_PROMPTS.analyze,
          variables: ["resume_text", "jd_text"],
          publish_status: "published",
          version: 1,
          environment: "production",
          description: "Default system prompt for ATS match score & keyword gap analysis",
          created_by: userId,
          updated_by: userId,
        },
        {
          name: "General Career Assistant System Prompt",
          prompt_type: "system",
          task_type: "general",
          segment: "all",
          content: SYSTEM_PROMPTS.general,
          variables: [],
          publish_status: "published",
          version: 1,
          environment: "production",
          description: "Fallback system prompt for general career assistance",
          created_by: userId,
          updated_by: userId,
        },
      ];

      await supabase.from("ai_prompt_templates").insert(defaults);
      invalidateAdminConfigCache();
    }
  } catch {
    // Non-fatal auto seed
  }
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const taskType = searchParams.get("task_type");
  const status = searchParams.get("status") ?? "all";

  // Check if seed needed
  await seedDefaultPromptsIfEmpty(supabase, auth.userId);

  let query = supabase.from("ai_prompt_templates").select("*").order("created_at", { ascending: false });
  if (taskType && taskType !== "all") query = query.eq("task_type", taskType);
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
  const { name, prompt_type, task_type, segment, content, variables, environment, description, tags, parent_id } = body;

  if (!name || !prompt_type || !content) {
    return NextResponse.json({ error: "name, prompt_type, and content are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_prompt_templates")
    .insert({
      name, prompt_type, task_type: task_type ?? "general",
      segment: segment ?? "all", content,
      variables: variables ?? [], environment: environment ?? "production",
      description, tags: tags ?? [], parent_id: parent_id ?? null,
      created_by: auth.userId, updated_by: auth.userId,
      publish_status: "draft", version: 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog("ai_prompt_templates", data.id, "create", null, data, auth.userId, auth.email);
  return NextResponse.json({ data }, { status: 201 });
}
