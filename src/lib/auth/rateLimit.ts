// lib/auth/rateLimit.ts
// Fixed-window rate limiting, backed by Redis with an in-process fallback.

import { redis, ensureRedis } from "@/lib/cache/redis";
import { AppError } from "@/lib/http/errors";

const memoryWindows = new Map<string, { count: number; expiresAt: number }>();

function readInMemory(key: string): number {
  const entry = memoryWindows.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return 0;
  return entry.count;
}

function consumeInMemory(key: string, windowSeconds: number): number {
  const now = Date.now();
  const existing = memoryWindows.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryWindows.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return 1;
  }

  existing.count += 1;

  // Opportunistically evict expired windows so a single process cannot grow
  // this map without bound under a spray of unique keys.
  if (memoryWindows.size > 5_000) {
    for (const [k, v] of memoryWindows) {
      if (v.expiresAt <= now) memoryWindows.delete(k);
    }
  }

  return existing.count;
}

/** Increments the counter for `key` and returns the new value. */
async function consume(key: string, windowSeconds: number): Promise<number> {
  const client = await ensureRedis();

  if (!client) return consumeInMemory(key, windowSeconds);

  try {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSeconds);
    return count;
  } catch {
    return consumeInMemory(key, windowSeconds);
  }
}

/** Reads the counter for `key` without incrementing it. */
async function peek(key: string): Promise<number> {
  const client = await ensureRedis();

  if (!client) return readInMemory(key);

  try {
    const value = await client.get(key);
    return value ? Number(value) : 0;
  } catch {
    return readInMemory(key);
  }
}

/**
 * Throws a 429 once `limit` requests for `key` are seen inside the window.
 *
 * Redis makes the counter shared across instances; if Redis is down we still
 * limit per-process, which is weaker but better than no limit at all.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  message = "Too many requests. Please wait a moment and try again."
): Promise<void> {
  const count = await consume(`ratelimit:${key}`, windowSeconds);
  if (count > limit) throw AppError.rateLimited(message);
}

/**
 * Brute-force protection that counts only *failed* attempts.
 *
 * Deliberately separate from the request ceiling above. A rural school shares
 * one connection, so every teacher signing in at the start of the day arrives
 * from a single IP address — a limit that counted successful sign-ins would
 * lock out the whole staff room by mid-morning. Failures are what indicate an
 * attack, so failures are what is counted, and a success clears the record.
 */
export const loginAttempts = {
  /** Throws if this identity has already failed too many times. */
  async assertNotLockedOut(key: string, limit: number): Promise<void> {
    const failures = await peek(`loginfail:${key}`);

    if (failures >= limit) {
      throw AppError.rateLimited(
        "Too many failed sign-in attempts. Please wait a few minutes and try again."
      );
    }
  },

  async recordFailure(key: string, windowSeconds: number): Promise<void> {
    await consume(`loginfail:${key}`, windowSeconds);
  },

  async clear(key: string): Promise<void> {
    const client = await ensureRedis();

    if (!client) {
      memoryWindows.delete(`loginfail:${key}`);
      return;
    }

    try {
      await client.del(`loginfail:${key}`);
    } catch {
      memoryWindows.delete(`loginfail:${key}`);
    }
  },
};

/** Best-effort client identity for rate-limit keys behind a proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export { redis as rateLimitBackend };
