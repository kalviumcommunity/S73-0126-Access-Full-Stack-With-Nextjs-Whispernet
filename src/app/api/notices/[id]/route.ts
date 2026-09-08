// app/api/notices/[id]/route.ts
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { invalidate, cacheTags } from "@/lib/cache";
import { updateNoticeSchema } from "@/lib/validation/notice";
import { logger } from "@/lib/utils/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseNoticeId(raw: string): number {
  if (!/^\d+$/.test(raw)) throw AppError.badRequest("Invalid notice id");

  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw AppError.badRequest("Invalid notice id");
  }

  return id;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = parseNoticeId((await context.params).id);

    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice || !notice.isActive) {
      throw AppError.notFound("Notice not found");
    }

    return ok(notice, "Notice fetched successfully");
  } catch (error) {
    return handleRouteError(error, "GET /api/notices/[id]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);
    const id = parseNoticeId((await context.params).id);

    const parsed = updateNoticeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const { expiresAt, ...rest } = parsed.data;

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        ...rest,
        ...(expiresAt === undefined
          ? {}
          : {
              expiresAt: expiresAt
                ? new Date(`${expiresAt}T23:59:59.999Z`)
                : null,
            }),
      },
    });

    await invalidate(cacheTags.notices);
    revalidatePath("/notices");

    logger.info("Notice updated", { noticeId: id, by: session.userId });

    return ok(notice, "Notice updated");
  } catch (error) {
    return handleRouteError(error, "PATCH /api/notices/[id]");
  }
}

/**
 * Withdraws a notice rather than deleting it: a school notice board is a
 * record of what was announced, so history is kept and simply hidden.
 * Administrators can purge permanently with `?permanent=true`.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(request, ...STAFF_ROLES);
    const id = parseNoticeId((await context.params).id);

    const permanent =
      new URL(request.url).searchParams.get("permanent") === "true";

    if (permanent) {
      if (session.role !== "ADMIN") {
        throw AppError.forbidden(
          "Only an administrator can permanently delete a notice"
        );
      }
      await prisma.notice.delete({ where: { id } });
    } else {
      await prisma.notice.update({ where: { id }, data: { isActive: false } });
    }

    await invalidate(cacheTags.notices);
    revalidatePath("/notices");

    logger.info(permanent ? "Notice deleted" : "Notice withdrawn", {
      noticeId: id,
      by: session.userId,
    });

    return ok(null, permanent ? "Notice deleted" : "Notice withdrawn");
  } catch (error) {
    return handleRouteError(error, "DELETE /api/notices/[id]");
  }
}
