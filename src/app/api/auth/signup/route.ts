// app/api/auth/signup/route.ts
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { signSession } from "@/lib/auth/jwt";
import { rateLimit, clientIp } from "@/lib/auth/rateLimit";
import { signupSchema } from "@/lib/validation/auth";
import { invalidate, cacheTags } from "@/lib/cache";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    // Loose enough that a school registering its staff in one sitting is not
    // blocked, tight enough to stop scripted account creation.
    await rateLimit(
      `signup:${clientIp(request)}`,
      20,
      60 * 60,
      "Too many accounts created from this connection. Please try again later."
    );

    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict("An account with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: await bcrypt.hash(password, 12),
        // Role is fixed server-side. Promotion to ADMIN is an operator action,
        // never something a signup request can ask for.
        role: "TEACHER",
        authProvider: "email",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    await invalidate(cacheTags.users);

    // Sign the new teacher straight in — one less step on a slow connection.
    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    logger.info("Account created", { userId: user.id });

    return ok({ token, user }, "Account created successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/signup");
  }
}
