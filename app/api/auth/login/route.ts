import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

// FIX: Remove fallback "secret"
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  // FIX: Runtime check for security
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
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError("Invalid credentials", ERROR_CODES.AUTH_ERROR, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError("Invalid credentials", ERROR_CODES.AUTH_ERROR, 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return sendSuccess({ token }, "Login successful");
  } catch (error) {
    // FIX: Log error on server, send generic message to client
    console.error("Login failed:", error);
    return sendError("Login failed", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
