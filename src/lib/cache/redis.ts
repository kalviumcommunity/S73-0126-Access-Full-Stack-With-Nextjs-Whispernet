// lib/cache/redis.ts
import Redis from "ioredis";
import { logger } from "@/lib/utils/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Redis is an optimisation, never a dependency. Every call site treats a failure
 * as a cache miss, so the app keeps working when the cache is down — which for a
 * rural deployment on flaky infrastructure is the normal case, not the edge case.
 */
function createClient(): Redis {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 1_000,
    commandTimeout: 1_000,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 5) return null; // stop reconnecting; calls degrade to misses
      return Math.min(times * 500, 5_000);
    },
  });

  client.on("error", (error: Error) => {
    // Logged at warn: a cache outage degrades latency, not correctness.
    logger.warn("Redis unavailable (serving from database)", {
      message: error.message,
    });
  });

  return client;
}

export const redis = globalForRedis.redis ?? createClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

/**
 * Resolves once the client is usable, or `null` if it is not.
 *
 * `lazyConnect` means no connection exists until something asks for one, and
 * `enableOfflineQueue: false` means a command issued before that point is
 * rejected outright rather than waiting. Every cache entry point therefore
 * calls this first: it opens the connection on the very first use and fails
 * fast — never hanging a page load — when Redis is genuinely down.
 */
/**
 * Circuit breaker.
 *
 * Without this, every request during a Redis outage pays the full connect
 * timeout before falling back to the database — turning a cache outage into a
 * site-wide slowdown, which is the opposite of what a cache is for. After a
 * failed attempt the cache is simply treated as absent for a cooling-off
 * period.
 */
const RETRY_COOLDOWN_MS = 10_000;
let unavailableUntil = 0;

export async function ensureRedis(): Promise<Redis | null> {
  // Read through a helper so TypeScript does not narrow the status to the value
  // it had before we awaited a connection.
  const status = () => redis.status as string;

  if (status() === "ready") return redis;
  if (Date.now() < unavailableUntil) return null;

  try {
    if (status() === "wait" || status() === "end") {
      await redis.connect();

      if (status() === "ready") {
        unavailableUntil = 0;
        return redis;
      }

      unavailableUntil = Date.now() + RETRY_COOLDOWN_MS;
      return null;
    }

    // Mid-handshake: wait briefly for it to settle rather than starting another.
    if (status() === "connecting" || status() === "reconnecting") {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Redis connection timed out"));
        }, 1_000);

        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          clearTimeout(timer);
          redis.off("ready", onReady);
          redis.off("error", onError);
        };

        redis.once("ready", onReady);
        redis.once("error", onError);
      });

      if (status() === "ready") {
        unavailableUntil = 0;
        return redis;
      }

      unavailableUntil = Date.now() + RETRY_COOLDOWN_MS;
      return null;
    }
  } catch {
    unavailableUntil = Date.now() + RETRY_COOLDOWN_MS;
    return null;
  }

  return null;
}

export default redis;
