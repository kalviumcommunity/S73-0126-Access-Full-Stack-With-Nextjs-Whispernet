// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // Use 'jose' for Edge compatibility

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Convert secret to Uint8Array for 'jose'
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Define Protected Routes
  // We want to protect /api/admin (Admin only) and /api/profile (All logged in)
  const isAdminRoute = pathname.startsWith("/api/admin");
  const isProtectedRoute = pathname.startsWith("/api/profile") || isAdminRoute;

  if (isProtectedRoute) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    // Check if token exists
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token missing" },
        { status: 401 }
      );
    }

    try {
      // Verify Token (using jose)
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"], // Be specific about algorithm
        clockTolerance: 5, // <--- ADD THIS (Allow 5 seconds time difference)
      });

      // Role Check for Admin Routes
      if (isAdminRoute && payload.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, message: "Access denied: Admins only" },
          { status: 403 }
        );
      }

      // Success! Pass user info to the next handler via headers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-email", payload.email as string);
      requestHeaders.set("x-user-role", payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("Middleware Auth Error:", error);

      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 403 }
      );
    }
  }

  // Allow all other routes (like login/signup) to pass
  return NextResponse.next();
}

// Configuration: Only run middleware on specific paths
export const config = {
  matcher: ["/api/admin/:path*", "/api/profile/:path*"],
};
