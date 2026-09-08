// lib/auth/session.ts
// Server-side guards for route handlers.

import type { Role } from "@prisma/client";
import { AppError } from "@/lib/http/errors";
import { bearerToken, verifySession, type SessionClaims } from "./jwt";

/**
 * Resolves the caller's session, or throws a 401.
 *
 * Every protected route calls this directly rather than trusting headers set by
 * middleware — middleware can be bypassed by internal rewrites, a route handler
 * cannot.
 */
export async function requireAuth(request: Request): Promise<SessionClaims> {
  const token = bearerToken(request.headers.get("authorization"));

  if (!token) throw AppError.unauthorized("Sign in to continue");

  try {
    return await verifySession(token);
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      throw error; // configuration fault, not an auth failure
    }
    throw AppError.unauthorized(
      "Your session has expired. Please sign in again."
    );
  }
}

/** Resolves the session and asserts the caller holds one of `roles`. */
export async function requireRole(
  request: Request,
  ...roles: Role[]
): Promise<SessionClaims> {
  const session = await requireAuth(request);

  if (!roles.includes(session.role)) {
    throw AppError.forbidden(
      `This action requires the ${roles.join(" or ")} role`
    );
  }

  return session;
}

/** Resolves the session if one is present, without failing anonymous callers. */
export async function optionalAuth(
  request: Request
): Promise<SessionClaims | null> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

/** Staff may read/manage school records; students get read-only surfaces. */
export const STAFF_ROLES: Role[] = ["TEACHER", "ADMIN"];
