/**
 * Rate Limiter — per-user sliding-window limits via Upstash Ratelimit SDK.
 *
 * Used in all /api/ai/... route handlers to prevent API key abuse.
 * Gracefully degrades: if UPSTASH_REDIS_REST_URL is not set, all limits pass.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Redis client (only instantiated when credentials exist) ─────────────────

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ─── Ratelimit instances (lazy — created once per process) ───────────────────

let _tailorResume:     Ratelimit | null = null;
let _coverLetter:      Ratelimit | null = null;
let _analyzeJob:       Ratelimit | null = null;
let _interviewEval:    Ratelimit | null = null;
let _companyResearch:  Ratelimit | null = null;
let _salaryCopilot:    Ratelimit | null = null;
let _autoApply:        Ratelimit | null = null;
let _general:          Ratelimit | null = null;

function makeLimiter(redis: Redis, count: number, windowStr: `${number} h` | `${number} d` = "1 h"): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, windowStr),
    analytics: true,
    prefix: "applyx:rl",
  });
}

function getLimiters() {
  const redis = getRedis();
  if (!redis) return null;

  if (!_tailorResume)     _tailorResume     = makeLimiter(redis, 10, "1 h");
  if (!_coverLetter)      _coverLetter      = makeLimiter(redis, 5, "1 h");
  if (!_analyzeJob)       _analyzeJob       = makeLimiter(redis, 20, "1 h");
  if (!_interviewEval)    _interviewEval    = makeLimiter(redis, 15, "1 h");
  if (!_companyResearch)  _companyResearch  = makeLimiter(redis, 20, "1 h");
  if (!_salaryCopilot)    _salaryCopilot    = makeLimiter(redis, 10, "1 h");
  if (!_autoApply)        _autoApply        = makeLimiter(redis, 10, "1 d"); // strict 10/day limit for safety
  if (!_general)          _general          = makeLimiter(redis, 30, "1 h");

  return {
    tailorResume: _tailorResume,
    coverLetter: _coverLetter,
    analyzeJob: _analyzeJob,
    interviewEval: _interviewEval,
    companyResearch: _companyResearch,
    salaryCopilot: _salaryCopilot,
    autoApply: _autoApply,
    general: _general,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type RateLimitKey =
  | "resume"
  | "cover-letter"
  | "analyze"
  | "interview-eval"
  | "company-research"
  | "salary-copilot"
  | "auto-apply"
  | "general";

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the rate limit resets (only set when blocked) */
  retryAfterSeconds?: number;
}

/**
 * Checks the per-user rate limit for the given task type.
 * Returns { allowed: true } immediately if Redis is not configured.
 *
 * @param userId  Supabase user UUID (used as the rate limit key)
 * @param task    The AI task type to apply the appropriate limit
 */
export async function checkRateLimit(
  userId: string,
  task: RateLimitKey
): Promise<RateLimitResult> {
  const limiters = getLimiters();

  // Graceful degradation — no Redis means no rate limiting
  if (!limiters) return { allowed: true };

  const limiterMap: Record<RateLimitKey, Ratelimit> = {
    resume:             limiters.tailorResume,
    "cover-letter":     limiters.coverLetter,
    analyze:            limiters.analyzeJob,
    "interview-eval":   limiters.interviewEval,
    "company-research": limiters.companyResearch,
    "salary-copilot":   limiters.salaryCopilot,
    "auto-apply":       limiters.autoApply,
    general:            limiters.general,
  };

  const limiter = limiterMap[task] ?? limiters.general;
  const key = `${task}:${userId}`;

  try {
    const result = await limiter.limit(key);
    if (result.success) return { allowed: true };

    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  } catch {
    // Rate limiter error is non-fatal — allow the request
    return { allowed: true };
  }
}

