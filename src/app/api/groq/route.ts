import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const { prompt, model = "llama-3.3-70b-versatile" } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}