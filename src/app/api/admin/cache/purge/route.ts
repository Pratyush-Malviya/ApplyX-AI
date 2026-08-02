import { NextResponse } from "next/server";
import { requireAdmin, auditLog } from "@/lib/admin-auth";
import { invalidateAdminConfigCache } from "@/lib/ai/admin-config";

// POST /api/admin/cache/purge — purge all in-memory admin config cache
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  invalidateAdminConfigCache();

  // Also purge Upstash Redis if configured
  let redisPurged = false;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const url = `${process.env.UPSTASH_REDIS_REST_URL}/flushdb`;
      await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
      redisPurged = true;
    } catch {
      // Non-fatal
    }
  }

  await auditLog("cache", null, "cache_purge", null, { redisPurged }, auth.userId, auth.email);

  return NextResponse.json({
    success: true,
    configCacheCleared: true,
    redisCacheCleared: redisPurged,
    message: "Cache purged successfully. Next requests will fetch fresh config and LLM responses.",
  });
}
