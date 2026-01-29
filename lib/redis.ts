// lib/redis.ts
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Create Redis client with error handling for serverless environments
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Stop retrying after 3 attempts
    if (times > 3) {
      console.warn("Redis connection failed after 3 attempts");
      return null;
    }
    // Retry after 200ms * attempt number
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true, // Don't connect immediately (important for serverless)
});

// Handle connection errors gracefully
redis.on("error", (error) => {
  console.warn("Redis connection error (non-fatal):", error.message);
});

export default redis;
