/**
 * /api/ai — Unified AI Gateway Route
 *
 * Single endpoint for all LLM calls in the application.
 * Replaces the old ad-hoc Groq→Gemini fallback with the full gateway stack:
 *   prompt builder → cache → task router → provider chain → cache write
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

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs"; // crypto module required for SHA-256 hashing

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, task, systemInstruction, userApiKey } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await callAI({
      prompt,
      task,
      systemInstruction,
      userApiKey,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[/api/ai]", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
