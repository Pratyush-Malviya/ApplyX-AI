import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";

// POST /api/admin/test/run — run a prompt test in the playground
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { prompt, task, systemInstruction, temperature, maxTokens } = body;

  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const start = Date.now();
  const result = await callAI({
    prompt,
    task,
    systemInstruction,
    temperature,
    maxTokens,
  });

  return NextResponse.json({
    ...result,
    latencyMs: Date.now() - start,
  });
}
