// app/api/auth/login/route.ts
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { signSession } from "@/lib/auth/jwt";
import { rateLimit, loginAttempts, clientIp } from "@/lib/auth/rateLimit";
import { loginSchema } from "@/lib/validation/auth";
import { logger } from "@/lib/utils/logger";

/** A bcrypt hash of nothing in particular, used to keep timing even. */
const DUMMY_HASH =
  "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7d0iZ0dQ4kQ6bLLQxYzOzRRkPnbNSPu";

const FAILURE_LIMIT = 8;
const FAILURE_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);

    // A generous ceiling that only stops outright hammering. The real
    // brute-force defence is the per-account failure counter below, because a
    // whole school shares one IP address and must not lock itself out.
    await rateLimit(`login:${ip}`, 60, 60);

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const { email, password } = parsed.data;
    const attemptKey = `${ip}:${email}`;

    await loginAttempts.assertNotLockedOut(attemptKey, FAILURE_LIMIT);

    const user = await prisma.user.findUnique({ where: { email } });

    // The same message and comparable work for both "no such account" and
    // "wrong password", so the response cannot be used to enumerate accounts.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.password || DUMMY_HASH
    );

    if (!user || !user.password || !passwordMatches) {
      await loginAttempts.recordFailure(attemptKey, FAILURE_WINDOW_SECONDS);
      logger.warn("Failed sign-in", { email, ip });
      throw new AppError("Incorrect email or password", "UNAUTHORIZED", 401);
    }

    // A correct password clears the record, so a teacher who mistypes twice and
    // then succeeds starts from a clean slate.
    await loginAttempts.clear(attemptKey);

    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    logger.info("User signed in", { userId: user.id, role: user.role });

    return ok(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      },
      "Signed in successfully"
    );
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/login");
  }
}
