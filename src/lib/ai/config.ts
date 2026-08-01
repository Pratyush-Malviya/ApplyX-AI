/**
 * AI Gateway Configuration
 * Central config that reads env vars and exposes feature flags.
 * All feature flags degrade gracefully — missing infra = feature disabled, not an error.
 */

export type TaskType = "resume" | "cover-letter" | "analyze" | "general";

export const AI_CONFIG = {
  // --- Feature flags (auto-detected from env) ---
  exactCacheEnabled: !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ),
  semanticCacheEnabled: !!(
    process.env.QDRANT_URL &&
    process.env.QDRANT_API_KEY
  ),

  // --- Cache settings ---
  cacheTTLSeconds: 86_400,           // 24 hours
  semanticSimilarityThreshold: 0.92, // cosine similarity threshold for Qdrant

  // --- Conversation memory ---
  maxHistoryTurns: 6,

  // --- Provider API keys (server-side only) ---
  groqApiKey:       process.env.GROQ_API_KEY        ?? "",
  geminiApiKey:     process.env.GEMINI_API_KEY       ?? "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY   ?? "",
  cerebrasApiKey:   process.env.CEREBRAS_API_KEY     ?? "",
} as const;

/**
 * Model routing table — best free models first, per task.
 *
 * Provider keys and their free tiers:
 *   gemini      → GEMINI_API_KEY      (already set) — 15 req/min free
 *   groq        → GROQ_API_KEY        (already set) — 6000 req/day free
 *   openrouter  → OPENROUTER_API_KEY  (optional)    — 50+ free models
 *   cerebras    → CEREBRAS_API_KEY    (optional)    — fastest inference, free tier
 *
 * Providers without a key are SKIPPED automatically — no errors, graceful fallback.
 */
export const ROUTING_TABLE: Record<
  TaskType,
  Array<{ provider: "groq" | "gemini" | "openrouter" | "cerebras"; model: string; displayName: string }>
> = {
  /**
   * RESUME TAILORING
   * Needs: precise instruction-following, STAR method, ATS keyword integration
   * Priority: Gemini 2.5 Pro (best free) → DeepSeek V3 → Qwen3-235B → LLaMA 3.3 → Flash fallback
   */
  resume: [
    // 🥇 Best free model — huge upgrade from Flash, same key
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    // Strong free models via OpenRouter (needs OPENROUTER_API_KEY)
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "openrouter", model: "qwen/qwen3-235b-a22b:free",           displayName: "Qwen3 235B" },
    // Fast Groq fallback — already set up
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    // Final safety net
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  /**
   * COVER LETTERS
   * Needs: natural prose, persuasive tone, professional human-sounding writing
   * Priority: Gemini 2.5 Pro → Qwen3-235B (great writer) → DeepSeek V3 → LLaMA 3.3
   */
  "cover-letter": [
    // 🥇 Best free option for writing quality
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    // Qwen3-235B is excellent at long-form persuasive writing
    { provider: "openrouter", model: "qwen/qwen3-235b-a22b:free",           displayName: "Qwen3 235B" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    // Groq fast fallback
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    // Final safety net
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  /**
   * JOB / ATS ANALYSIS
   * Needs: structured reasoning, JSON-accurate output, long context for full JDs
   * Priority: Gemini 2.5 Pro (1M ctx) → DeepSeek R1 (reasoning model) → DeepSeek V3
   */
  analyze: [
    // 🥇 Best for long-context structured output (1M token window, free)
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    // DeepSeek R1 — dedicated reasoning model, excellent at analysis
    { provider: "openrouter", model: "deepseek/deepseek-r1:free",           displayName: "DeepSeek R1 (Reasoning)" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    // Fast Groq fallback
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    // Final safety net
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  /**
   * GENERAL
   * Balanced quality + speed for miscellaneous queries
   */
  general: [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],
};
