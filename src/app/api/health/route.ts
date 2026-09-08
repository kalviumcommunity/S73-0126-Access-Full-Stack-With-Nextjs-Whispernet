// app/api/health/route.ts
import { prisma } from "@/lib/db/prisma";
import { cacheHealth } from "@/lib/cache";
import { ok, fail } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for Docker, Netlify and uptime checks.
 *
 * The database is required, Redis is not: a cache outage is reported as
 * "degraded" with a 200 because the app still serves every page correctly.
 */
export async function GET() {
  const startedAt = Date.now();

  const [database, cache] = await Promise.all([
    prisma.$queryRaw`SELECT 1`
      .then(() => ({ connected: true }))
      .catch(() => ({ connected: false })),
    cacheHealth(),
  ]);

  const body = {
    status: database.connected
      ? cache.connected
        ? "healthy"
        : "degraded"
      : "unhealthy",
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      database,
      cache,
    },
    durationMs: Date.now() - startedAt,
  };

  if (!database.connected) {
    return fail("Database unreachable", "INTERNAL_ERROR", 503, body);
  }

  return ok(body, `Service is ${body.status}`);
}

/**
 * The offline provider probes this with HEAD every 30 seconds; answering
 * explicitly keeps that check to response headers only.
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
