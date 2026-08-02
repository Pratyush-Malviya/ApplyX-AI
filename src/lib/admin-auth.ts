/**
 * Admin middleware helper — verifies admin role from Supabase JWT.
 * Import and call at the top of every admin API route.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string; email: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const role =
      user.user_metadata?.role ||
      user.app_metadata?.role;

    if (role !== "admin") {
      return { error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }) };
    }

    return { userId: user.id, email: user.email ?? "" };
  } catch {
    return { error: NextResponse.json({ error: "Auth check failed" }, { status: 500 }) };
  }
}

/** Logs an admin action to ai_audit_logs */
export async function auditLog(
  entityType: string,
  entityId: string | null,
  action: string,
  beforeData: unknown,
  afterData: unknown,
  actorId: string,
  actorEmail: string
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("ai_audit_logs").insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      before_data: beforeData,
      after_data: afterData,
      actor_id: actorId,
      actor_email: actorEmail,
    });
  } catch {
    // Audit log failure is non-fatal
  }
}
