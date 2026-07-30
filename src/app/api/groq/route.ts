import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, model = "llama-3.3-70b-versatile" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Try Gemini API first if configured
    if (geminiKey) {
      const geminiModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
      for (const geminiModel of geminiModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: "You are an expert career coach and resume writer helping Indian job seekers. Provide concise, professional, and actionable responses.",
                  },
                ],
              },
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000,
              },
            }),
          });

          const data = await response.json();

          if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return NextResponse.json({
              content: data.candidates[0].content.parts[0].text,
              provider: "gemini",
              model: geminiModel,
            });
          }
        } catch (e) {
          // Continue to next model or Groq fallback
        }
      }
    }

    // Fallback to Groq API
    if (groqKey) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert career coach and resume writer helping Indian job seekers. Provide concise, professional, and actionable responses.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.error?.message || "Groq API error" },
          { status: response.status }
        );
      }

      return NextResponse.json({
        content: data.choices[0].message.content,
        provider: "groq",
      });
    }

    return NextResponse.json(
      { error: "Neither GEMINI_API_KEY nor GROQ_API_KEY is configured" },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}