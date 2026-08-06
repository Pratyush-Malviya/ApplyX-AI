import { NextResponse, type NextRequest } from "next/server";
import { callAI } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 1. Auth Check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to access Interview Prep." },
      { status: 401 }
    );
  }

  // 2. Body Parse
  let body: { question?: string; answer?: string; targetRole?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, answer, targetRole } = body;

  if (!question || !answer) {
    return NextResponse.json(
      { error: "Both 'question' and 'answer' are required." },
      { status: 400 }
    );
  }

  // 3. Rate Limit Check (15 req/hr per user)
  const rateLimit = await checkRateLimit(user.id, "interview-eval");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Interview Prep rate limit reached. Retry in ${rateLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) },
      }
    );
  }

  // 4. Call AI Gateway
  try {
    const prompt = `Target Role: ${targetRole || "Software Engineer"}\nInterview Question: ${question}\nCandidate Answer: ${answer}\n\nEvaluate this candidate's response against executive STAR framework criteria. Provide a numeric score (0-100), detailed feedback on Situation/Task, Action, and Result components, key improvement areas, and a rewritten executive-level STAR answer example.`;

    const result = await callAI({
      prompt,
      task: "interview-eval",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
