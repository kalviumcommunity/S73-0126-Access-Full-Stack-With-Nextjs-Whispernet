// app/api/auth/me/route.ts
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { requireAuth } from "@/lib/auth/session";

/**
 * Returns the signed-in user straight from the database.
 *
 * The client decodes its JWT for instant rendering, but role changes and
 * deactivations only show up when the server is asked — so this endpoint is the
 * source of truth the app revalidates against on load.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        authProvider: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized("This account no longer exists");
    }

    return ok({ user }, "Session is valid");
  } catch (error) {
    return handleRouteError(error, "GET /api/auth/me");
  }
}
