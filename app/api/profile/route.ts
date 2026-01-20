// app/api/profile/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function GET(req: Request) {
  try {
    // 1. Get the Header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(
        "Token missing or invalid format",
        ERROR_CODES.AUTH_ERROR,
        401
      );
    }

    // 2. Extract Token (Remove "Bearer " prefix)
    const token = authHeader.split(" ")[1];

    // 3. Verify Token
    // If invalid, jwt.verify throws an error
    const decoded = jwt.verify(token, JWT_SECRET);

    return sendSuccess(
      { user: decoded },
      "You have accessed a protected route!"
    );
  } catch (error) {
    return sendError("Invalid or expired token", ERROR_CODES.AUTH_ERROR, 403);
  }
}
