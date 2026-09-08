// app/api/notices/route.ts
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { optionalAuth, requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { cached, invalidate, cacheKeys, cacheTags } from "@/lib/cache";
import { buildMeta } from "@/lib/validation/common";
import { createNoticeSchema, noticeQuerySchema } from "@/lib/validation/notice";
import { logger } from "@/lib/utils/logger";

const LIST_TTL_SECONDS = 60;

const noticeSelect = {
  id: true,
  title: true,
  content: true,
  category: true,
  priority: true,
  isPinned: true,
  isActive: true,
  authorName: true,
  publishedAt: true,
  expiresAt: true,
  updatedAt: true,
} satisfies Prisma.NoticeSelect;

/**
 * The notice board is public — parents and pupils read it without an account.
 * Staff additionally see withdrawn notices when they ask for them.
 */
export async function GET(request: Request) {
  try {
    const session = await optionalAuth(request);
    const isStaff = session ? STAFF_ROLES.includes(session.role) : false;

    const { searchParams } = new URL(request.url);
    const parsed = noticeQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!parsed.success) {
      throw AppError.badRequest(
        "Invalid query parameters",
        fieldErrors(parsed.error)
      );
    }

    const { page, limit, category, search } = parsed.data;
    const includeInactive = Boolean(parsed.data.includeInactive) && isStaff;

    const now = new Date();
    const where: Prisma.NoticeWhereInput = {
      ...(includeInactive
        ? {}
        : {
            isActive: true,
            // An expiry date means "stop showing this", so past-dated notices
            // drop off the board on their own.
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          }),
      ...(category ? { category } : {}),
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { content: { contains: search, mode: "insensitive" } },
                  { authorName: { contains: search, mode: "insensitive" } },
                ],
              },
            ],
          }
        : {}),
    };

    const cacheKey = cacheKeys.noticeList(
      JSON.stringify({ page, limit, category, search, includeInactive })
    );

    const result = await cached(cacheKey, LIST_TTL_SECONDS, async () => {
      const [notices, total] = await prisma.$transaction([
        prisma.notice.findMany({
          where,
          select: noticeSelect,
          skip: (page - 1) * limit,
          take: limit,
          // Pinned notices first, then newest.
          orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        }),
        prisma.notice.count({ where }),
      ]);

      return { notices, meta: buildMeta(total, page, limit) };
    });

    return ok(result.data, "Notices fetched successfully", {
      headers: { "X-Cache": result.status },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/notices");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);

    const parsed = createNoticeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const { expiresAt, ...rest } = parsed.data;

    const notice = await prisma.notice.create({
      data: {
        ...rest,
        authorId: session.userId,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.999Z`) : null,
      },
      select: noticeSelect,
    });

    await invalidate(cacheTags.notices);
    // Push the statically-rendered board forward immediately instead of waiting
    // out its revalidation window.
    revalidatePath("/notices");

    logger.info("Notice published", {
      noticeId: notice.id,
      by: session.userId,
    });

    return ok(notice, "Notice published", { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/notices");
  }
}
