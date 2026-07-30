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
    const { prompt, model = "llama-3.3-70b-versatile" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Try Groq LLaMA 3.3 70B first
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: EXECUTIVE_SYSTEM_PROMPT,
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 3000,
          }),
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          return NextResponse.json({
            content: data.choices[0].message.content,
            provider: "groq",
            model: "Meta LLaMA 3.3 (70B)",
          });
        }
      } catch (e) {
        // Fallback to Gemini
      }
    }

    // Fallback to Gemini API
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: EXECUTIVE_SYSTEM_PROMPT }],
            },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 4000 },
          }),
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return NextResponse.json({
            content: data.candidates[0].content.parts[0].text,
            provider: "gemini",
            model: "Google Gemini 2.5 Flash",
          });
        }
      } catch (e) {
        // Continue
      }
    }

    return NextResponse.json(
      { error: "No working free LLM provider available. Check API key configuration." },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}