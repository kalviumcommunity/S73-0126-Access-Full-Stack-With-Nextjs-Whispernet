// app/api/students/route.ts
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { prisma } from "@/lib/prisma";

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

    if (!body.name || !body.grade) {
      // STANDARDIZED ERROR
      return sendError(
        "Name and Grade are required",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    const newStudent = await prisma.student.create({
      data: {
        name: body.name,
        grade: body.grade,
        section: body.section || "A",
      },
    });

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
