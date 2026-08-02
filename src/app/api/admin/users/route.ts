import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/users — list all users with profile data
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "all";
  const role = searchParams.get("role") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const offset = (page - 1) * limit;

  let query = supabase.from("profiles").select("*", { count: "exact" });
  if (plan !== "all") query = query.eq("plan", plan);
  if (role !== "all") query = query.eq("role", role);
  if (status !== "all") query = query.eq("status", status);
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, limit });
}
