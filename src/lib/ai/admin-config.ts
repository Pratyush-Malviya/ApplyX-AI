/**
 * Admin Config Resolver
 * Reads live admin configuration from Supabase with a 60-second in-memory cache.
 * Falls back to static config.ts values when no admin config exists.
 * Zero-downtime — works even if DB tables are empty.
 */

import { createClient } from "@/lib/supabase/server";
import { ROUTING_TABLE, AI_CONFIG, type TaskType } from "./config";
import { SYSTEM_PROMPTS } from "./prompt-builder";

// ─── In-Memory TTL Cache ──────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet<T>(key: string, value: T): void {
  memCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminModelRoute {
  provider: "groq" | "gemini" | "openrouter" | "cerebras";
  model: string;
  displayName: string;
}

export interface AdminPrompt {
  id: string;
  content: string;
  version: number;
  promptType: string;
}

export interface AdminGenerationPolicy {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tone?: string;
  length?: string;
  style?: string;
  cacheEnabled?: boolean;
  cacheTtlSeconds?: number;
  forceStructured?: boolean;
  forceHeadings?: boolean;
  emojiAllowed?: boolean;
}

export interface AdminConfig {
  routes: Record<string, AdminModelRoute[]>;
  prompts: Record<string, AdminPrompt>;
  policy: AdminGenerationPolicy;
}

// ─── Resolver ────────────────────────────────────────────────────────────────

/**
 * Fetches active published admin configuration from Supabase.
 * Results are cached in memory for 60 seconds to minimise DB round-trips.
 */
export async function getAdminConfig(): Promise<AdminConfig> {
  const cacheKey = "admin_config_v1";
  const cached = memGet<AdminConfig>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = await createClient();

    // Fetch routes, prompts, and policy in parallel
    const [routesRes, promptsRes, policyRes] = await Promise.all([
      supabase
        .from("ai_model_routes")
        .select("*")
        .eq("publish_status", "published")
        .eq("enabled", true)
        .order("priority", { ascending: true }),
      supabase
        .from("ai_prompt_templates")
        .select("*")
        .eq("publish_status", "published")
        .eq("environment", "production"),
      supabase
        .from("ai_generation_policies")
        .select("*")
        .eq("publish_status", "published")
        .eq("segment", "all")
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    // Build routes map from DB (fall back to static if empty)
    const routes: Record<string, AdminModelRoute[]> = {};
    if (routesRes.data && routesRes.data.length > 0) {
      for (const row of routesRes.data) {
        const key = row.task_type as string;
        if (!routes[key]) routes[key] = [];
        // primary_model is stored as { provider, model, displayName }
        routes[key].push(row.primary_model as AdminModelRoute);
        const fallbacks = (row.fallback_models as AdminModelRoute[]) ?? [];
        routes[key].push(...fallbacks);
      }
    } else {
      // Use static routing table as fallback
      Object.assign(routes, ROUTING_TABLE);
    }

    // Build prompts map
    const prompts: Record<string, AdminPrompt> = {};
    if (promptsRes.data && promptsRes.data.length > 0) {
      for (const row of promptsRes.data) {
        const key = `${row.prompt_type}:${row.task_type}`;
        prompts[key] = {
          id: row.id,
          content: row.content,
          version: row.version,
          promptType: row.prompt_type,
        };
      }
    }

    // Build policy
    const policy: AdminGenerationPolicy = {};
    if (policyRes.data) {
      const p = policyRes.data;
      policy.temperature = p.temperature ?? undefined;
      policy.maxTokens = p.verbosity_ceiling ?? undefined;
      policy.cacheEnabled = p.cache_enabled ?? true;
      policy.cacheTtlSeconds = p.cache_ttl_seconds ?? AI_CONFIG.cacheTTLSeconds;
      policy.forceStructured = p.force_structured ?? false;
      policy.forceHeadings = p.force_headings ?? false;
      policy.emojiAllowed = p.emoji_allowed ?? false;
      policy.tone = p.tone ?? undefined;
      policy.length = p.length ?? undefined;
      policy.style = p.style ?? undefined;
    }

    const config: AdminConfig = { routes, prompts, policy };
    memSet(cacheKey, config);
    return config;
  } catch (err) {
    // Silently degrade — return static config
    console.warn("[AdminConfig] Failed to load admin config from DB, using static fallback:", err);
    const config: AdminConfig = {
      routes: ROUTING_TABLE as unknown as Record<string, AdminModelRoute[]>,
      prompts: {},
      policy: {},
    };
    memSet(cacheKey, config);
    return config;
  }
}

/**
 * Returns active prompt content for a given type+task, or falls back to static SYSTEM_PROMPTS.
 */
export async function getActiveSystemPrompt(task: TaskType): Promise<string> {
  const config = await getAdminConfig();
  const key = `system:${task}`;
  if (config.prompts[key]) return config.prompts[key].content;
  // Fallback to static
  return SYSTEM_PROMPTS[task] ?? SYSTEM_PROMPTS.general;
}

/**
 * Returns active route chain for a task, or falls back to static ROUTING_TABLE.
 */
export async function getActiveRoutes(task: TaskType): Promise<AdminModelRoute[]> {
  const config = await getAdminConfig();
  return (config.routes[task] as AdminModelRoute[]) ?? (ROUTING_TABLE[task] as unknown as AdminModelRoute[]);
}

/**
 * Returns the active generation policy (temperature, max_tokens, etc).
 */
export async function getActivePolicy(): Promise<AdminGenerationPolicy> {
  const config = await getAdminConfig();
  return config.policy;
}

/**
 * Invalidates the in-memory admin config cache.
 * Call this after publishing any prompt/route/policy change.
 */
export function invalidateAdminConfigCache(): void {
  memCache.delete("admin_config_v1");
}
