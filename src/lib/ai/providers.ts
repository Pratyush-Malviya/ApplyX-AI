/**
 * AI Provider Adapters
 * Clean, typed wrappers for each LLM provider.
 * All return a unified ProviderResponse or null on failure.
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderResponse {
  content: string;
  provider: string;
  model: string;
  displayName: string;
}

type CallOptions = { temperature?: number; maxTokens?: number };

// ─── Groq (OpenAI-compatible) ────────────────────────────────────────────────

export async function callGroq(
  apiKey: string,
  model: string,
  displayName: string,
  messages: Message[],
  options: CallOptions = {}
): Promise<ProviderResponse | null> {
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 8192,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (response.ok && text) {
      return { content: text, provider: "groq", model, displayName };
    }
    console.warn("[AI Gateway] Groq error:", data?.error?.message ?? response.status);
  } catch (e: any) {
    console.warn("[AI Gateway] Groq timeout/network error:", e?.message);
  }
  return null;
}

// ─── Google Gemini ───────────────────────────────────────────────────────────

export async function callGemini(
  apiKey: string,
  model: string,
  displayName: string,
  messages: Message[],
  options: CallOptions = {}
): Promise<ProviderResponse | null> {
  if (!apiKey) return null;
  try {
    const systemMsg = messages.find((m) => m.role === "system");
    const conversationMsgs = messages.filter((m) => m.role !== "system");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: Record<string, unknown> = {
      contents: conversationMsgs.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: options.temperature ?? 0.6,
        maxOutputTokens: options.maxTokens ?? 8192,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000), // Pro can be slower — give it more time
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (response.ok && text) {
      return { content: text, provider: "gemini", model, displayName };
    }
    console.warn("[AI Gateway] Gemini error:", data?.error?.message ?? response.status);
  } catch (e: any) {
    console.warn("[AI Gateway] Gemini timeout/network error:", e?.message);
  }
  return null;
}

// ─── OpenRouter (DeepSeek, Qwen3, and 50+ free models) ──────────────────────

export async function callOpenRouter(
  apiKey: string,
  model: string,
  displayName: string,
  messages: Message[],
  options: CallOptions = {}
): Promise<ProviderResponse | null> {
  if (!apiKey) return null;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://applyx.ai",
        "X-Title": "ApplyX AI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 8192,
      }),
      signal: AbortSignal.timeout(60_000), // DeepSeek R1 reasoning can take time
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (response.ok && text) {
      return { content: text, provider: "openrouter", model, displayName };
    }
    console.warn("[AI Gateway] OpenRouter error:", data?.error?.message ?? response.status);
  } catch (e: any) {
    console.warn("[AI Gateway] OpenRouter timeout/network error:", e?.message);
  }
  return null;
}

// ─── Cerebras (World's fastest LLM inference — 2000+ tokens/sec) ─────────────

export async function callCerebras(
  apiKey: string,
  model: string,
  displayName: string,
  messages: Message[],
  options: CallOptions = {}
): Promise<ProviderResponse | null> {
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 8192,
      }),
      signal: AbortSignal.timeout(20_000), // Cerebras is very fast — short timeout is fine
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (response.ok && text) {
      return { content: text, provider: "cerebras", model, displayName };
    }
    console.warn("[AI Gateway] Cerebras error:", data?.error?.message ?? response.status);
  } catch (e: any) {
    console.warn("[AI Gateway] Cerebras timeout/network error:", e?.message);
  }
  return null;
}
