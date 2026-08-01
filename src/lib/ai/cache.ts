/**
 * Two-Layer Cache
 *
 * Layer 1: Exact-match cache (Upstash Redis)
 *   - SHA-256 hash of normalized prompt → cached response
 *   - Sub-millisecond reads on hit
 *   - Enabled when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
 *
 * Layer 2: Semantic cache (Qdrant) — Phase 3, stubbed for now
 *   - Enabled when QDRANT_URL + QDRANT_API_KEY are set
 *
 * When cache infra is absent, all methods are no-ops / return null.
 * The system degrades gracefully — no errors, just direct LLM calls.
 */

import { AI_CONFIG } from "./config";
import type { ProviderResponse } from "./providers";
import { createHash } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CacheType = "exact" | "semantic" | null;

export interface CacheHit {
  content: string;
  provider: string;
  model: string;
  displayName: string;
  cacheType: CacheType;
}

// ─── Prompt Hashing ──────────────────────────────────────────────────────────

/**
 * Normalizes and SHA-256 hashes a prompt for exact-match keying.
 * Normalization: trim + lowercase to catch trivial variations.
 */
export function hashPrompt(prompt: string): string {
  const normalized = prompt.trim().toLowerCase();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

const CACHE_NAMESPACE = "applyx:llm:resp";

function buildRedisKey(hash: string): string {
  return `${CACHE_NAMESPACE}:${hash}`;
}

// ─── Upstash Redis (Exact-Match Cache) ───────────────────────────────────────

async function redisGet(key: string): Promise<string | null> {
  if (!AI_CONFIG.exactCacheEnabled) return null;
  try {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result ?? null;
  } catch {
    return null;
  }
}

async function redisSetEx(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!AI_CONFIG.exactCacheEnabled) return;
  try {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/setex/${encodeURIComponent(key)}/${ttlSeconds}/${encodeURIComponent(value)}`;
    await fetch(url, {
      method: "GET", // Upstash REST uses GET for SETEX
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Cache write failure is non-fatal
  }
}

// ─── Public Cache API ─────────────────────────────────────────────────────────

/**
 * Checks both cache layers for a hit on the given prompt.
 * Returns CacheHit or null on miss.
 */
export async function getCached(prompt: string): Promise<CacheHit | null> {
  // Layer 1: Exact match
  if (AI_CONFIG.exactCacheEnabled) {
    const hash = hashPrompt(prompt);
    const key = buildRedisKey(hash);
    const raw = await redisGet(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ProviderResponse;
        return { ...parsed, cacheType: "exact" };
      } catch {
        // Malformed cache entry — treat as miss
      }
    }
  }

  // Layer 2: Semantic cache (Phase 3 — stub)
  // if (AI_CONFIG.semanticCacheEnabled) { ... }

  return null;
}

/**
 * Writes a successful LLM response to all enabled cache layers.
 * Fire-and-forget style — errors are swallowed to not affect response time.
 */
export async function setCached(
  prompt: string,
  response: ProviderResponse
): Promise<void> {
  if (AI_CONFIG.exactCacheEnabled) {
    const hash = hashPrompt(prompt);
    const key = buildRedisKey(hash);
    const value = JSON.stringify(response);
    // Don't await — write happens in background
    redisSetEx(key, value, AI_CONFIG.cacheTTLSeconds).catch(() => {});
  }

  // Semantic cache write (Phase 3 — stub)
  // if (AI_CONFIG.semanticCacheEnabled) { ... }
}
