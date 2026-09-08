// app/api/dashboard/stats/route.ts
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError } from "@/lib/http/responses";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { cached, cacheHealth, cacheKeys } from "@/lib/cache";
import { todayIso, toUtcDate } from "@/lib/validation/attendance";

const STATS_TTL_SECONDS = 60;

/**
 * Headline numbers for the staff dashboard.
 *
 * Available to teachers as well as administrators — the previous admin-only
 * gate meant every teacher's dashboard rendered zeroes behind a silent 403.
 * Staff-wide figures are shared; the user count is administrative and only
 * added for admins, which is why the role is part of the cache key.
 */
export async function GET(request: Request) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);
    const isAdmin = session.role === "ADMIN";

    const today = todayIso();

    const result = await cached(
      cacheKeys.dashboardStats(session.role),
      STATS_TTL_SECONDS,
      async () => {
        const [
          totalStudents,
          activeClasses,
          markedToday,
          presentToday,
          activeNotices,
          totalStaff,
        ] = await prisma.$transaction([
          prisma.student.count({ where: { isActive: true } }),
          // A "class" is a distinct grade+section that has pupils in it.
          prisma.student.groupBy({
            by: ["grade", "section"],
            where: { isActive: true },
            orderBy: [{ grade: "asc" }, { section: "asc" }],
          }),
          prisma.attendance.count({ where: { date: toUtcDate(today) } }),
          prisma.attendance.count({
            where: {
              date: toUtcDate(today),
              status: { in: ["PRESENT", "LATE"] },
            },
          }),
          prisma.notice.count({
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
            },
          }),
          prisma.user.count(),
        ]);

        return {
          totalStudents,
          activeClasses: activeClasses.length,
          activeNotices,
          attendance: {
            date: today,
            marked: markedToday,
            present: presentToday,
            rate:
              markedToday === 0
                ? null
                : Math.round((presentToday / markedToday) * 100),
            pending: Math.max(0, totalStudents - markedToday),
          },
          ...(isAdmin ? { totalStaff } : {}),
          generatedAt: new Date().toISOString(),
        };
      }
    );

    const health = await cacheHealth();

    return ok(
      {
        ...result.data,
        cache: {
          status: result.status,
          durationMs: result.durationMs,
          connected: health.connected,
          ttlSeconds: STATS_TTL_SECONDS,
        },
      },
      result.status === "HIT"
        ? "Statistics served from Redis cache"
        : "Statistics computed from the database",
      { headers: { "X-Cache": result.status } }
    );
  } catch (error) {
    return handleRouteError(error, "GET /api/dashboard/stats");
  }
}
