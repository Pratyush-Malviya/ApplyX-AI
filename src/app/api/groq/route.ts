/**
 * /api/groq — Deprecated, forwards to /api/ai
 *
 * This route is kept for backwards compatibility only.
 * All new code should call /api/ai directly.
 * @deprecated Use POST /api/ai instead
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await callAI({ prompt, task: "general" });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}