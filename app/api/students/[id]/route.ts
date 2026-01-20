// app/api/students/[id]/route.ts
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/schemas/studentSchema";
import { ZodError } from "zod";

// Helper to validate ID
function parseId(params: { id: string }) {
  const id = parseInt(params.id);
  return isNaN(id) ? null : id;
}

// 1. GET: Fetch Single Student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params are promises in Next.js 15
) {
  const { id } = await params;
  const studentId = parseId({ id });

  if (studentId === null) {
    return sendError("Invalid ID format", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { attendance: true }, // Bonus: Include their attendance history
  });

  if (!student) {
    return sendError("Student not found", ERROR_CODES.NOT_FOUND, 404);
  }

  return sendSuccess(student, "Student details fetched successfully");
}

// 2. PATCH: Update Student details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studentId = parseId({ id });

  if (studentId === null) {
    return sendError("Invalid ID format", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  try {
    const body = await request.json();

    // Use .partial() to allow updating single fields
    const validatedData = studentSchema.partial().parse(body);

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: validatedData,
    });

    return sendSuccess(updatedStudent, "Student updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((e) => ({
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

    return sendError(
      "Failed to update student",
      ERROR_CODES.DB_ERROR,
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// 3. DELETE: Remove Student
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studentId = parseId({ id });

  if (studentId === null) {
    return sendError("Invalid ID format", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });

    return sendSuccess(null, "Student deleted successfully");
  } catch (error) {
    return sendError(
      "Failed to delete student",
      ERROR_CODES.DB_ERROR,
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
