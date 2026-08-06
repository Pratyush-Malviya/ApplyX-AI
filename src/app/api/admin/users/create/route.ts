import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdmin();

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password, full_name, role = "user", plan = "free" } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || email.split("@")[0],
          role: role,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    // Upsert public profile record with role
    const profileData = {
      id: newUserId,
      email,
      full_name: full_name || email.split("@")[0],
      role: role,
      plan: plan,
      status: "active",
      ai_calls_limit: plan === "enterprise" ? 1000 : plan === "pro" ? 250 : 50,
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      // Fallback: try update if upsert fails
      await supabase.from("profiles").update({ role, plan }).eq("id", newUserId);
    }

    await auditLog("profiles", newUserId, "create", null, profileData, auth.userId, auth.email);

    return NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        email,
        full_name: profileData.full_name,
        role: role,
        plan: plan,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}
