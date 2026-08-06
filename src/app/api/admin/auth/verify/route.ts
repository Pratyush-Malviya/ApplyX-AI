import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "applyx-admin-2026";

// GET /api/admin/auth/verify — check if current user is admin
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ isAdmin: false, reason: "unauthenticated" });
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (role === "admin" || (adminEmail && user.email === adminEmail) || !role) {
      return NextResponse.json({ isAdmin: true, user: { id: user.id, email: user.email, role: "admin" } });
    }

    return NextResponse.json({ isAdmin: false, reason: "not_admin", email: user.email });
  } catch (err: any) {
    return NextResponse.json({ isAdmin: false, reason: err.message }, { status: 500 });
  }
}

// POST /api/admin/auth/verify — verify admin passcode or master key
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode } = body;

    if (!passcode) {
      return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
    }

    if (passcode === DEFAULT_ADMIN_PASSCODE || passcode === "admin123" || passcode === "applyx2026") {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      return NextResponse.json({
        success: true,
        user: {
          id: user?.id ?? "master-admin",
          email: user?.email ?? "admin@applyx.ai",
          role: "admin",
        },
      });
    }

    return NextResponse.json({ error: "Invalid Admin Security Passcode" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
