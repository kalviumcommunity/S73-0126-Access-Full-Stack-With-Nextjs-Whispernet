// lib/redis.ts
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Singleton pattern to prevent multiple connections in development
const redis = new Redis(redisUrl);

export default redis;
