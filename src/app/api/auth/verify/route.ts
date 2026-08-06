/**
 * /api/auth/verify — Session verification endpoint for the Chrome Extension.
 *
 * The extension calls this before every autofill operation to re-confirm
 * the user's session is still valid server-side.
 *
 * Response (200): { authenticated: true, userId: string, email: string }
 * Response (401): { authenticated: false }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
  });
}
