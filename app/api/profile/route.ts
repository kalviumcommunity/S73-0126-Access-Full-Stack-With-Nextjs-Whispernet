import jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

// FIX: Remove fallback
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: Request) {
  // FIX: Runtime check
  if (!JWT_SECRET) {
    console.error(
      "CRITICAL: JWT_SECRET is not defined in environment variables."
    );
    return sendError(
      "Internal server configuration error",
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(
        "Token missing or invalid format",
        ERROR_CODES.AUTH_ERROR,
        401
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    return sendSuccess(
      { user: decoded },
      "You have accessed a protected route!"
    );
  } catch (error) {
    // FIX: Distinguish between Auth errors and Server errors
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return sendError("Invalid or expired token", ERROR_CODES.AUTH_ERROR, 403);
    }

    console.error("Profile access error:", error);
    return sendError(
      "An unexpected error occurred",
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
