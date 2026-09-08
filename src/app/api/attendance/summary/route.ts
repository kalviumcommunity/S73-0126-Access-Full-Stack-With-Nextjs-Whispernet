// app/api/attendance/summary/route.ts
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { requireAuth } from "@/lib/auth/session";
import { cached, cacheKeys } from "@/lib/cache";
import {
  attendanceHistorySchema,
  toUtcDate,
  toIsoDate,
  todayIso,
  daysAgoIso,
} from "@/lib/validation/attendance";

const SUMMARY_TTL_SECONDS = 60;

/**
 * Attendance rates over a date range, aggregated in the database.
 *
 * `groupBy` keeps the work in Postgres — pulling every record over the wire to
 * count them in Node is exactly the kind of payload this app cannot afford.
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const parsed = attendanceHistorySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!parsed.success) {
      throw AppError.badRequest(
        "Invalid query parameters",
        fieldErrors(parsed.error)
      );
    }

    const to = parsed.data.to ?? todayIso();
    const from = parsed.data.from ?? daysAgoIso(29);

    if (from > to) {
      throw AppError.badRequest("The start date must be before the end date");
    }

    const { grade, section } = parsed.data;
    const cacheKey = cacheKeys.attendanceSummary(
      `${from}:${to}:${grade ?? "all"}:${section ?? "all"}`
    );

    const result = await cached(cacheKey, SUMMARY_TTL_SECONDS, async () => {
      const studentFilter =
        grade || section
          ? {
              student: {
                ...(grade ? { grade } : {}),
                ...(section ? { section } : {}),
              },
            }
          : {};

      const where = {
        date: { gte: toUtcDate(from), lte: toUtcDate(to) },
        ...studentFilter,
      };

      const [byStatus, byDay, totalStudents] = await Promise.all([
        prisma.attendance.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
        }),
        prisma.attendance.groupBy({
          by: ["date", "status"],
          where,
          _count: { _all: true },
          orderBy: { date: "asc" },
        }),
        prisma.student.count({
          where: {
            isActive: true,
            ...(grade ? { grade } : {}),
            ...(section ? { section } : {}),
          },
        }),
      ]);

      const totals = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
      for (const row of byStatus) totals[row.status] = row._count._all;

      const recorded = Object.values(totals).reduce((sum, n) => sum + n, 0);
      const attending = totals.PRESENT + totals.LATE;

      // One row per day, so the dashboard can draw a trend without post-processing.
      const days = new Map<
        string,
        {
          date: string;
          present: number;
          absent: number;
          late: number;
          excused: number;
        }
      >();

      for (const row of byDay) {
        const key = toIsoDate(row.date);
        const entry = days.get(key) ?? {
          date: key,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };

        if (row.status === "PRESENT") entry.present = row._count._all;
        if (row.status === "ABSENT") entry.absent = row._count._all;
        if (row.status === "LATE") entry.late = row._count._all;
        if (row.status === "EXCUSED") entry.excused = row._count._all;

        days.set(key, entry);
      }

      return {
        range: { from, to },
        totals,
        recorded,
        totalStudents,
        attendanceRate:
          recorded === 0 ? null : Math.round((attending / recorded) * 100),
        daily: Array.from(days.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    });

    return ok(result.data, "Attendance summary fetched", {
      headers: { "X-Cache": result.status },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/attendance/summary");
  }
}
