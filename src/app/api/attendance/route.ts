// app/api/attendance/route.ts
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { requireAuth, requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { invalidate, cacheTags } from "@/lib/cache";
import {
  attendanceQuerySchema,
  markAttendanceSchema,
  toUtcDate,
  toIsoDate,
} from "@/lib/validation/attendance";
import { logger } from "@/lib/utils/logger";

/**
 * Returns a class roster for one day, with each pupil's mark attached.
 *
 * The register is returned whole — students without a record yet come back with
 * `status: null` — so a teacher can open the page on a poor connection, get the
 * full class in one request, and mark it offline.
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const parsed = attendanceQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!parsed.success) {
      throw AppError.badRequest(
        "Invalid query parameters",
        fieldErrors(parsed.error)
      );
    }

    const { date, grade, section } = parsed.data;
    const day = toUtcDate(date);

    const students = await prisma.student.findMany({
      where: { grade, section, isActive: true },
      select: { id: true, name: true, rollNumber: true },
      orderBy: [{ rollNumber: "asc" }, { name: "asc" }],
    });

    const marks = await prisma.attendance.findMany({
      where: { date: day, studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true, status: true, note: true, updatedAt: true },
    });

    const byStudent = new Map(marks.map((mark) => [mark.studentId, mark]));

    const roster = students.map((student) => {
      const mark = byStudent.get(student.id);
      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        status: mark?.status ?? null,
        note: mark?.note ?? null,
        markedAt: mark?.updatedAt ?? null,
      };
    });

    const marked = roster.filter((entry) => entry.status !== null).length;

    return ok(
      {
        date,
        grade,
        section,
        roster,
        summary: {
          total: roster.length,
          marked,
          pending: roster.length - marked,
          present: roster.filter((e) => e.status === "PRESENT").length,
          absent: roster.filter((e) => e.status === "ABSENT").length,
          late: roster.filter((e) => e.status === "LATE").length,
          excused: roster.filter((e) => e.status === "EXCUSED").length,
        },
      },
      "Attendance register loaded"
    );
  } catch (error) {
    return handleRouteError(error, "GET /api/attendance");
  }
}

/**
 * Records marks for a class.
 *
 * Written as one upsert per student inside a transaction: the unique
 * `(studentId, date)` constraint means a replayed submission from the offline
 * outbox corrects the existing row instead of creating a duplicate, so syncing
 * the same register twice is harmless.
 */
export async function POST(request: Request) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);

    const parsed = markAttendanceSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const { date, records } = parsed.data;
    const day = toUtcDate(date);

    // A future date almost always means a mis-set device clock.
    if (day.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw AppError.badRequest(
        "Attendance cannot be recorded for a future date"
      );
    }

    const studentIds = records.map((record) => record.studentId);
    const known = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true },
    });

    if (known.length !== new Set(studentIds).size) {
      throw AppError.badRequest(
        "One or more students in this register no longer exist"
      );
    }

    await prisma.$transaction(
      records.map((record) =>
        prisma.attendance.upsert({
          where: {
            studentId_date: { studentId: record.studentId, date: day },
          },
          create: {
            studentId: record.studentId,
            date: day,
            status: record.status,
            note: record.note,
            markedById: session.userId,
          },
          update: {
            status: record.status,
            note: record.note ?? null,
            markedById: session.userId,
          },
        })
      )
    );

    await invalidate(cacheTags.attendance);

    logger.info("Attendance recorded", {
      date: toIsoDate(day),
      count: records.length,
      by: session.userId,
    });

    return ok(
      { date, saved: records.length },
      `Attendance saved for ${records.length} student${records.length === 1 ? "" : "s"}`
    );
  } catch (error) {
    return handleRouteError(error, "POST /api/attendance");
  }
}
