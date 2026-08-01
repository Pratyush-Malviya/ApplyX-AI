/**
 * AI Gateway Orchestrator
 * The single entry point for all AI calls in the application.
 *
 * Flow:
 *   request → prompt builder → exact cache check → semantic cache check
 *           → router (task classify → model chain) → cache write → response
 */

import { buildPrompt, type BuildPromptOptions } from "./prompt-builder";
import { getCached, setCached, type CacheType } from "./cache";
import { route, type RouterOptions } from "./router";
import type { Message } from "./providers";

export interface GatewayRequest {
  /** The user's raw prompt text */
  prompt: string;
  /**
   * Explicit task type override.
   * If omitted, the router auto-classifies from the prompt.
   * Valid values: "resume" | "cover-letter" | "analyze" | "general"
   */
  task?: string;
  /** Override the system prompt entirely */
  systemInstruction?: string;
  /** Pass a fully assembled messages array (skips the prompt builder) */
  messages?: Message[];
  /** User-provided API key (takes precedence over server-side env key) */
  userApiKey?: string;
  /** Conversation history for multi-turn context */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Additional context documents injected before the user query */
  contextDocuments?: Array<{ label: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface GatewayResponse {
  content: string;
  provider: string;
  model: string;
  displayName: string;
  cached: boolean;
  cacheType: CacheType;
  task: string;
  latencyMs: number;
}

/**
 * Main AI gateway function.
 * Call this from any Next.js API route instead of calling providers directly.
 */
export async function callAI(req: GatewayRequest): Promise<GatewayResponse> {
  const start = Date.now();

  // 1. Build messages array (use provided or build from prompt)
  const messages: Message[] =
    req.messages ??
    buildPrompt({
      userQuery: req.prompt,
      task: (req.task as BuildPromptOptions["task"]) ?? "general",
      systemInstruction: req.systemInstruction,
      history: req.history,
      contextDocuments: req.contextDocuments,
    });

  // 2. Cache lookup — use the raw prompt as cache key (not the assembled messages)
  //    This ensures semantically identical prompts from different callers still hit
  const cacheKey = req.prompt;
  const cacheHit = await getCached(cacheKey);
  if (cacheHit) {
    return {
      content: cacheHit.content,
      provider: cacheHit.provider,
      model: cacheHit.model,
      displayName: cacheHit.displayName,
      cached: true,
      cacheType: cacheHit.cacheType,
      task: req.task ?? "auto",
      latencyMs: Date.now() - start,
    };
  }

  // 3. Route to best available model
  const routerOptions: RouterOptions = {
    task: req.task,
    userApiKey: req.userApiKey,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
  };

  const result = await route(messages, routerOptions);

  // 4. Write to cache (fire-and-forget, non-blocking)
  setCached(cacheKey, result).catch(() => {});

  return {
    content: result.content,
    provider: result.provider,
    model: result.model,
    displayName: result.displayName,
    cached: false,
    cacheType: null,
    task: req.task ?? "auto",
    latencyMs: Date.now() - start,
  };
}

// Re-export key types so consumers only need to import from this file
export type { Message } from "./providers";
export type { TaskType } from "./config";
export { SYSTEM_PROMPTS } from "./prompt-builder";
export { classifyTask } from "./router";
