// lib/cache/index.ts
// A thin cache-aside layer over Redis with graceful degradation.

import { ensureRedis } from "./redis";
import { logger } from "@/lib/utils/logger";

/** Namespaced cache keys, kept in one place so invalidation can never drift. */
export const cacheKeys = {
  dashboardStats: (role: string) => `dashboard:stats:${role}`,
  studentList: (query: string) => `students:list:${query}`,
  studentCount: () => "students:count",
  noticeList: (query: string) => `notices:list:${query}`,
  attendanceSummary: (date: string) => `attendance:summary:${date}`,
} as const;

/** Key prefixes wiped together when the underlying data changes. */
export const cacheTags = {
  students: ["dashboard:stats:", "students:", "attendance:"],
  notices: ["notices:", "dashboard:stats:"],
  attendance: ["attendance:", "dashboard:stats:"],
  users: ["dashboard:stats:"],
} as const;

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

export interface CacheResult<T> {
  data: T;
  status: CacheStatus;
  /** Milliseconds spent producing the value (cache read or full recompute). */
  durationMs: number;
}

const DEFAULT_TTL_SECONDS = 60;

/**
 * Cache-aside read-through.
 *
 * Returns the cache status alongside the value so callers can report honestly
 * (`X-Cache: HIT`) instead of guessing from response latency.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  produce: () => Promise<T>
): Promise<CacheResult<T>> {
  const startedAt = Date.now();
  const client = await ensureRedis();

  if (!client) {
    // Cache unreachable — answer from the database and say so.
    const data = await produce();
    return { data, status: "BYPASS", durationMs: Date.now() - startedAt };
  }

  try {
    const hit = await client.get(key);
    if (hit) {
      return {
        data: JSON.parse(hit) as T,
        status: "HIT",
        durationMs: Date.now() - startedAt,
      };
    }
  } catch {
    const data = await produce();
    return { data, status: "BYPASS", durationMs: Date.now() - startedAt };
  }

  const data = await produce();

  try {
    await client.set(
      key,
      JSON.stringify(data),
      "EX",
      ttlSeconds || DEFAULT_TTL_SECONDS
    );
  } catch {
    // Losing the write only costs us the next request's latency.
  }

  return { data, status: "MISS", durationMs: Date.now() - startedAt };
}

/**
 * Drops every key under the given prefixes.
 *
 * Uses SCAN rather than KEYS so invalidation never blocks the Redis event loop
 * on a large keyspace.
 */
export async function invalidate(prefixes: readonly string[]): Promise<number> {
  let removed = 0;
  const client = await ensureRedis();

  if (!client) {
    logger.warn("Cache invalidation skipped (Redis unavailable)", { prefixes });
    return 0;
  }

  try {
    for (const prefix of prefixes) {
      let cursor = "0";
      do {
        const [next, keys] = await client.scan(
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          100
        );
        cursor = next;
        if (keys.length > 0) {
          removed += await client.del(...keys);
        }
      } while (cursor !== "0");
    }

    if (removed > 0) logger.debug("Cache invalidated", { prefixes, removed });
  } catch {
    // A stale cache self-heals within the TTL; never fail the write for this.
    logger.warn("Cache invalidation skipped (Redis unavailable)", { prefixes });
  }

  return removed;
}

/** Liveness probe used by the health endpoint and the dashboard cache panel. */
export async function cacheHealth(): Promise<{
  connected: boolean;
  latencyMs: number | null;
}> {
  const startedAt = Date.now();
  const client = await ensureRedis();

  if (!client) return { connected: false, latencyMs: null };

  try {
    await client.ping();
    return { connected: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { connected: false, latencyMs: null };
  }
}
