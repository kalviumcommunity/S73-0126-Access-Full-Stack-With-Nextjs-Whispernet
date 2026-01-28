// app/api/students/route.ts
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/schemas/studentSchema";
import redis from "@/lib/redis";

// Cache key for admin stats (must match admin/stats/route.ts)
const ADMIN_STATS_CACHE_KEY = "admin:stats";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const students = await prisma.student.findMany({
      skip,
      take: limit,
      orderBy: { id: "asc" },
    });

    const total = await prisma.student.count();

    // WRAPPED RESPONSE
    return sendSuccess(
      {
        students,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      "Students fetched successfully"
    );
  } catch (error) {
    return sendError(
      "Failed to fetch students",
      ERROR_CODES.DB_ERROR,
      500,
      error instanceof Error ? error.message : error
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. VALIDATION LAYER (Zod) - Using safeParse for better error handling
    const result = studentSchema.safeParse(body);

    if (!result.success) {
      // Format Zod errors into a readable list
      const formattedErrors = result.error.issues.map((e) => ({
        field: e.path[0],
        message: e.message,
      }));

      return sendError(
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        400,
        formattedErrors
      );
    }

    // 2. DATABASE LAYER (Prisma)
    // We use 'result.data' here, which is the validated data
    const newStudent = await prisma.student.create({
      data: {
        name: result.data.name,
        grade: result.data.grade,
        section: result.data.section || "A",
      },
    });

    // Invalidate admin stats cache so dashboard updates immediately
    await redis.del(ADMIN_STATS_CACHE_KEY);

    return sendSuccess(newStudent, "Student created successfully", 201);
  } catch (error) {
    return sendError(
      "Failed to create student",
      ERROR_CODES.DB_ERROR,
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
