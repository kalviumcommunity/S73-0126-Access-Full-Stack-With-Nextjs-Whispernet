// app/api/admin/stats/route.ts
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis"; // Import Redis
import { sendSuccess } from "@/lib/responseHandler";
import { handleError } from "@/lib/errorHandler";

// Cache Key Strategy: Keep it simple and descriptive
const CACHE_KEY = "admin:stats";
const CACHE_TTL = 60; // Time to live in seconds

export async function GET() {
  try {
    const start = Date.now();

    // 1. CHECK CACHE (Cache-Aside Pattern)
    const cachedData = await redis.get(CACHE_KEY);

    if (cachedData) {
      const duration = Date.now() - start;
      console.log(`🚀 Cache HIT (${duration}ms)`);

      // Return cached data immediately
      return sendSuccess(JSON.parse(cachedData), "Stats fetched from Cache");
    }

    // 2. CACHE MISS (Fetch from DB)
    console.log("🐢 Cache MISS - Querying Database...");

    // Simulate a "Heavy" operation (Count real users)
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.student.count();

    // Simulate extra latency (e.g., complex calculation) so you can see the difference
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const stats = {
      totalUsers,
      totalStudents,
      activeClasses: 12, // Hardcoded for now
      generatedAt: new Date().toISOString(),
    };

    // 3. STORE IN CACHE
    // "EX" = Expire in seconds
    await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", CACHE_TTL);

    const duration = Date.now() - start;
    console.log(`💾 Data Cached (${duration}ms)`);

    return sendSuccess(stats, "Stats fetched from Database");
  } catch (error) {
    return handleError(error, "GET /api/admin/stats");
  }
}
