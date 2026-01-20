// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError("Invalid credentials", ERROR_CODES.AUTH_ERROR, 401);
    }

    // 2. Verify Password
    // Compare the raw password input with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError("Invalid credentials", ERROR_CODES.AUTH_ERROR, 401);
    }

    // 3. Generate Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    return sendSuccess({ token }, "Login successful");
  } catch (error) {
    return sendError(
      "Login failed",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      error instanceof Error ? error.message : error
    );
  }
}
