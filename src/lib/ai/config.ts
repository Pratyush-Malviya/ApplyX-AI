/**
 * AI Gateway Configuration
 * Central config that reads env vars and exposes feature flags.
 * All feature flags degrade gracefully — missing infra = feature disabled, not an error.
 */

export type TaskType =
  | "resume"
  | "cover-letter"
  | "analyze"
  | "interview-eval"
  | "company-research"
  | "salary-copilot"
  | "auto-apply"
  | "general";

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
 */
export const ROUTING_TABLE: Record<
  TaskType,
  Array<{ provider: "groq" | "gemini" | "openrouter" | "cerebras"; model: string; displayName: string }>
> = {
  resume: [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "openrouter", model: "qwen/qwen3-235b-a22b:free",           displayName: "Qwen3 235B" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  "cover-letter": [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "qwen/qwen3-235b-a22b:free",           displayName: "Qwen3 235B" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  analyze: [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-r1:free",           displayName: "DeepSeek R1 (Reasoning)" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  "interview-eval": [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-r1:free",           displayName: "DeepSeek R1 (Reasoning)" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  "company-research": [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  "salary-copilot": [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-r1:free",           displayName: "DeepSeek R1 (Reasoning)" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  "auto-apply": [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],

  general: [
    { provider: "gemini",     model: "gemini-2.5-pro",                    displayName: "Google Gemini 2.5 Pro" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", displayName: "DeepSeek V3" },
    { provider: "groq",       model: "llama-3.3-70b-versatile",            displayName: "Meta LLaMA 3.3 (70B)" },
    { provider: "cerebras",   model: "llama3.3-70b",                       displayName: "Cerebras LLaMA 3.3 (70B)" },
    { provider: "gemini",     model: "gemini-2.5-flash",                   displayName: "Google Gemini 2.5 Flash" },
  ],
};

