/**
 * /api/ai — Unified AI Gateway Route
 *
 * Single endpoint for all LLM calls in the application.
 * Replaces the old ad-hoc Groq→Gemini fallback with the full gateway stack:
 *   auth check → rate limit → prompt builder → cache → task router → provider chain → cache write
 *
 * Request body:
 *   prompt           string   (required) The user's raw input
 *   task             string   (optional) "resume"|"cover-letter"|"analyze"|"general"
 *   systemInstruction string  (optional) Override system prompt
 *   model            string   (optional) Legacy field — ignored (router decides)
 *   userApiKey       string   (optional) User-supplied API key
 *
 * Response:
 *   content      string   The AI-generated text
 *   provider     string   e.g. "groq", "gemini"
 *   displayName  string   e.g. "Meta LLaMA 3.3 (70B)"
 *   cached       boolean  Whether response came from cache
 *   cacheType    string   "exact" | "semantic" | null
 *   task         string   Detected or provided task type
 *   latencyMs    number   Total processing time in ms
 */

import { NextResponse, type NextRequest } from "next/server";
import { callAI } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, type RateLimitKey } from "@/lib/rate-limiter";

export const runtime = "nodejs"; // crypto module required for SHA-256 hashing

export async function POST(request: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to use the AI gateway." },
      { status: 401 }
    );
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { prompt, task, systemInstruction, userApiKey } = body as {
    prompt?: string;
    task?: string;
    systemInstruction?: string;
    userApiKey?: string;
  };

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "prompt is required and must be a string" },
      { status: 400 }
    );
  }

  // ── 3. Rate limit — per user, per task type ────────────────────────────────
  const resolvedTask = (task ?? "general") as RateLimitKey;
  const rateLimit = await checkRateLimit(user.id, resolvedTask);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. You've made too many ${resolvedTask} requests. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
          "X-RateLimit-Task": resolvedTask,
        },
      }
    );
  }

  // ── 4. Call AI gateway ─────────────────────────────────────────────────────
  try {
    const result = await callAI({
      prompt,
      task,
      systemInstruction,
      userApiKey,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/ai]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

