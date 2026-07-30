import { NextResponse } from "next/server";

const EXECUTIVE_SYSTEM_PROMPT = `You are a Principal Executive Career Strategist and Elite ATS Resume Writer with 15+ years of experience optimizing candidate profiles for top global tech companies and ATS systems (Taleo, Workday, Greenhouse).

Follow these rules strictly:
1. STAR METHODOLOGY: Rewrite bullet points using Situation/Task -> Action -> Quantified Result.
2. HIGH-IMPACT ACTION VERBS: Start every bullet with a strong past-tense action verb (e.g., Engineered, Spearheaded, Architected, Optimized, Orchestrated).
3. QUANTIFIABLE METRICS: Include realistic metrics (%, $, latency, scale, time saved) demonstrating tangible business impact.
4. ATS KEYWORD MATCHING: Naturally integrate exact technical terms and core competencies from the target job description.
5. NO FLUFF: Avoid generic buzzwords. Be specific, precise, concise, and executive-ready.`;

export async function POST(request: Request) {
  try {
    const { prompt, systemInstruction = EXECUTIVE_SYSTEM_PROMPT } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Active Gemini models list
    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    let lastError = "Failed to connect to Gemini API";

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 4000,
            },
          }),
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return NextResponse.json({
            content: data.candidates[0].content.parts[0].text,
            model: "Google Gemini 2.5 Flash",
            provider: "gemini",
          });
        }

        if (data.error?.message) {
          lastError = data.error.message;
        }
      } catch (err: any) {
        lastError = err?.message || `Error calling ${model}`;
      }
    }

    return NextResponse.json(
      { error: lastError },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
