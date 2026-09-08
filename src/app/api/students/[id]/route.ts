// app/api/students/[id]/route.ts
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { requireAuth, requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { invalidate, cacheTags } from "@/lib/cache";
import { updateStudentSchema } from "@/lib/validation/student";
import { logger } from "@/lib/utils/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Strict integer parsing.
 *
 * `parseInt` would happily read "12abc" as 12 and "1e5" as 1, so ids are
 * matched against a digits-only pattern before being trusted.
 */
function parseStudentId(raw: string): number {
  if (!/^\d+$/.test(raw)) {
    throw AppError.badRequest("Invalid student id");
  }

  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw AppError.badRequest("Invalid student id");
  }

  return id;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAuth(request);
    const id = parseStudentId((await context.params).id);

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: { date: "desc" },
          take: 30,
          select: { id: true, date: true, status: true, note: true },
        },
      },
    });

    if (!student) throw AppError.notFound("Student not found");

    const present = student.attendance.filter(
      (record) => record.status === "PRESENT" || record.status === "LATE"
    ).length;

    return ok(
      {
        ...student,
        attendanceSummary: {
          recorded: student.attendance.length,
          present,
          rate:
            student.attendance.length === 0
              ? null
              : Math.round((present / student.attendance.length) * 100),
        },
      },
      "Student details fetched successfully"
    );
  } catch (error) {
    return handleRouteError(error, "GET /api/students/[id]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);
    const id = parseStudentId((await context.params).id);

    const parsed = updateStudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const student = await prisma.student.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        rollNumber: true,
        grade: true,
        section: true,
        guardianName: true,
        guardianPhone: true,
        isActive: true,
      },
    });

    await invalidate(cacheTags.students);

    logger.info("Student updated", { studentId: id, by: session.userId });

    return ok(student, "Student updated successfully");
  } catch (error) {
    return handleRouteError(error, "PATCH /api/students/[id]");
  }
}

/**
 * Removing a pupil is destructive and takes their attendance history with it,
 * so it is restricted to administrators. Teachers mark a student inactive
 * instead (PATCH `isActive: false`), which keeps the records intact.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(request, "ADMIN");
    const id = parseStudentId((await context.params).id);

    await prisma.student.delete({ where: { id } });
    await invalidate(cacheTags.students);

    logger.info("Student deleted", { studentId: id, by: session.userId });

    return ok(null, "Student removed successfully");
  } catch (error) {
    return handleRouteError(error, "DELETE /api/students/[id]");
  }
}
