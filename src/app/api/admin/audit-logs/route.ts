import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const entityType = searchParams.get("entity_type") ?? "all";
  const action = searchParams.get("action") ?? "all";
  const offset = (page - 1) * limit;

  let query = supabase.from("ai_audit_logs").select("*", { count: "exact" });
  if (entityType !== "all") query = query.eq("entity_type", entityType);
  if (action !== "all") query = query.eq("action", action);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, limit });
}
