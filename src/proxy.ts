// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { bearerToken, verifySession } from "@/lib/auth/jwt";

/**
 * Edge-side gate for the API. (Next.js 16 renamed this convention from
 * `middleware` to `proxy`; the behaviour is unchanged.)
 *
 * This is a first line of defence, not the only one: every protected route
 * handler independently calls `requireAuth`/`requireRole`. A proxy can be
 * skipped by internal rewrites, so authorisation is never left to it alone.
 */

/** Endpoints reachable without a session. */
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/google",
  "/api/health",
];

function isPublic(pathname: string, method: string): boolean {
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route)))
    return true;
  // The notice board is readable by parents and pupils without an account;
  // publishing to it is not.
  if (pathname.startsWith("/api/notices") && method === "GET") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname, request.method)) {
    return NextResponse.next();
  }

  const token = bearerToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Sign in to continue",
        data: null,
        error: { code: "UNAUTHORIZED" },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  try {
    const claims = await verifySession(token);

    // Strip any client-supplied identity headers before forwarding, so a
    // request can never spoof the user a downstream handler sees.
    const headers = new Headers(request.headers);
    headers.delete("x-user-id");
    headers.delete("x-user-email");
    headers.delete("x-user-role");
    headers.set("x-user-id", String(claims.userId));
    headers.set("x-user-email", claims.email);
    headers.set("x-user-role", claims.role);

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Your session has expired. Please sign in again.",
        data: null,
        error: { code: "UNAUTHORIZED" },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
