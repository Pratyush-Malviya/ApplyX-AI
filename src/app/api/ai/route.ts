import { NextResponse } from "next/server";

export const EXECUTIVE_SYSTEM_PROMPT = `You are a Principal Executive Career Strategist and Elite ATS Resume Writer with 15+ years of experience optimizing candidate profiles for top global tech companies and ATS systems (Taleo, Workday, Greenhouse).

Follow these rules strictly:
1. STAR METHODOLOGY: Rewrite bullet points using Situation/Task -> Action -> Quantified Result.
2. HIGH-IMPACT ACTION VERBS: Start every bullet with a strong past-tense action verb (e.g., Engineered, Spearheaded, Architected, Optimized, Orchestrated).
3. QUANTIFIABLE METRICS: Include realistic metrics (%, $, latency, scale, time saved) demonstrating tangible business impact.
4. ATS KEYWORD MATCHING: Naturally integrate exact technical terms and core competencies from the target job description.
5. NO FLUFF: Avoid generic buzzwords. Be specific, precise, concise, and executive-ready.`;

export async function POST(request: Request) {
  try {
    const {
      prompt,
      systemInstruction = EXECUTIVE_SYSTEM_PROMPT,
      model = "auto",
      userApiKey,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const geminiKey = userApiKey || process.env.GEMINI_API_KEY;
    const groqKey = userApiKey || process.env.GROQ_API_KEY;

    // 1. Direct LLaMA 3.3 70B request
    if (model === "llama-3.3-70b" || model === "groq") {
      if (groqKey) {
        const groqRes = await callGroq(groqKey, "llama-3.3-70b-versatile", systemInstruction, prompt);
        if (groqRes) return NextResponse.json(groqRes);
      }
    }

    // 2. Direct Gemini 2.5 Flash request
    if (model === "gemini-2.5-flash" || model === "gemini") {
      if (geminiKey) {
        const geminiRes = await callGemini(geminiKey, "gemini-2.5-flash", systemInstruction, prompt);
        if (geminiRes) return NextResponse.json(geminiRes);
      }
    }

    // 3. Auto strategy: Try LLaMA 3.3 70B (Groq) -> Gemini 2.5 Flash -> Qwen 27B
    if (groqKey) {
      const res1 = await callGroq(groqKey, "llama-3.3-70b-versatile", systemInstruction, prompt);
      if (res1) return NextResponse.json(res1);
    }

    if (geminiKey) {
      const res2 = await callGemini(geminiKey, "gemini-2.5-flash", systemInstruction, prompt);
      if (res2) return NextResponse.json(res2);
    }

    if (groqKey) {
      const res3 = await callGroq(groqKey, "qwen/qwen3.6-27b", systemInstruction, prompt);
      if (res3) return NextResponse.json(res3);
    }

    return NextResponse.json(
      { error: "No working free LLM provider available. Please check API keys." },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function callGroq(apiKey: string, model: string, system: string, prompt: string) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    if (response.ok && data.choices?.[0]?.message?.content) {
      return {
        content: data.choices[0].message.content,
        provider: "groq",
        model: "Meta LLaMA 3.3 (70B)",
      };
    }
  } catch (e) {
    // Allow fallback
  }
  return null;
}

async function callGemini(apiKey: string, model: string, system: string, prompt: string) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 4000 },
      }),
    });

    const data = await response.json();
    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        content: data.candidates[0].content.parts[0].text,
        provider: "gemini",
        model: "Google Gemini 2.5 Flash",
      };
    }
  } catch (e) {
    // Allow fallback
  }
  return null;
}
