// app/api/auth/signup/route.ts
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // 1. Basic Validation
    if (!email || !password) {
      return sendError(
        "Email and Password are required",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(
        "User already exists",
        ERROR_CODES.VALIDATION_ERROR,
        409
      );
    }

    // 3. Hash the password
    // 10 salt rounds is the industry standard balance between speed and security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "TEACHER",
      },
    });

    // Invalidate the cache because the user count has changed!
    // Use try-catch to prevent Redis failures from breaking signup
    try {
      await redis.del("admin:stats");
      console.log("🧹 Cache Invalidated: admin:stats");
    } catch (cacheError) {
      console.warn("Redis cache invalidation failed (non-fatal):", cacheError);
    }
    // ----------------------

    // Remove password from response for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser;

    return sendSuccess(userWithoutPassword, "Signup successful", 201);
  } catch (error) {
    console.error("Signup failed:", error);

    // Include error details for debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);

    return sendError(
      "Signup failed: " + errorMessage,
      ERROR_CODES.INTERNAL_ERROR,
      500,
      errorMessage
    );
  }
}
