// app/api/students/route.ts
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { requireAuth, requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { cached, invalidate, cacheKeys, cacheTags } from "@/lib/cache";
import { buildMeta } from "@/lib/validation/common";
import {
  createStudentSchema,
  studentQuerySchema,
} from "@/lib/validation/student";
import { logger } from "@/lib/utils/logger";

const LIST_TTL_SECONDS = 30;

/** Shape returned to clients; keeps the API stable if columns are added. */
const studentSelect = {
  id: true,
  name: true,
  rollNumber: true,
  grade: true,
  section: true,
  guardianName: true,
  guardianPhone: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.StudentSelect;

export async function GET(request: Request) {
  try {
    // Any signed-in member of the school may read the roster.
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const parsed = studentQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!parsed.success) {
      throw AppError.badRequest(
        "Invalid query parameters",
        fieldErrors(parsed.error)
      );
    }

    const { page, limit, search, grade, section, includeInactive } =
      parsed.data;

    // Filtering happens in SQL, not in the browser: searching must reach
    // students on every page, not just the ten currently rendered.
    const where: Prisma.StudentWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(grade ? { grade } : {}),
      ...(section ? { section } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { rollNumber: { contains: search, mode: "insensitive" } },
              { guardianName: { contains: search, mode: "insensitive" } },
              { guardianPhone: { contains: search } },
            ],
          }
        : {}),
    };

    const cacheKey = cacheKeys.studentList(
      JSON.stringify({ page, limit, search, grade, section, includeInactive })
    );

    const result = await cached(cacheKey, LIST_TTL_SECONDS, async () => {
      // One round trip instead of two sequential queries.
      const [students, total] = await prisma.$transaction([
        prisma.student.findMany({
          where,
          select: studentSelect,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ grade: "asc" }, { section: "asc" }, { name: "asc" }],
        }),
        prisma.student.count({ where }),
      ]);

      return { students, meta: buildMeta(total, page, limit) };
    });

    return ok(result.data, "Students fetched successfully", {
      headers: { "X-Cache": result.status },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/students");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);

    const parsed = createStudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const student = await prisma.student.create({
      data: parsed.data,
      select: studentSelect,
    });

    await invalidate(cacheTags.students);

    logger.info("Student enrolled", {
      studentId: student.id,
      by: session.userId,
    });

    return ok(student, "Student added successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/students");
  }
}
