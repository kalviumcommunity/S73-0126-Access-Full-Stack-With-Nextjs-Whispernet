// lib/errorHandler.ts
import { NextResponse } from "next/server";
import { logger } from "./logger";
import { ERROR_CODES } from "./errorCodes";

interface ErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: unknown;
    stack?: string; // Only for dev
  };
  timestamp: string;
}

export function handleError(error: unknown, context: string) {
  // Determine environment
  // Note: Vercel/Next.js sets NODE_ENV automatically
  const isProd = process.env.NODE_ENV === "production";

  // Type guard for Error instances
  const isError = (err: unknown): err is Error => err instanceof Error;

  // 1. Log the full error (Always log everything!)
  logger.error(`Error in ${context}`, error);

  // 2. Prepare the response for the User
  const response: ErrorResponse = {
    success: false,
    message: isProd
      ? "Something went wrong. Please try again later." // Safe message for prod
      : isError(error)
        ? error.message
        : "Unknown error", // Detailed message for dev
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
    },
    timestamp: new Date().toISOString(),
  };

  // 3. Attach stack trace ONLY in development
  if (!isProd && isError(error) && error.stack) {
    if (!response.error) response.error = { code: ERROR_CODES.INTERNAL_ERROR };
    response.error.stack = error.stack;
  }

  return NextResponse.json(response, { status: 500 });
}
