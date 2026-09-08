// lib/http/responses.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, ErrorCode, type ErrorCodeValue } from "./errors";
import { logger } from "@/lib/utils/logger";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details?: unknown };
  timestamp: string;
}

interface SuccessOptions {
  status?: number;
  /** Extra response headers, e.g. `{ "X-Cache": "HIT" }`. */
  headers?: Record<string, string>;
}

export function ok<T>(
  data: T,
  message = "Success",
  options: SuccessOptions = {}
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: options.status ?? 200, headers: options.headers }
  );
}

export function fail(
  message: string,
  code: ErrorCodeValue = ErrorCode.INTERNAL_ERROR,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
      error: { code, ...(details === undefined ? {} : { details }) },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/** Flattens a Zod error into `[{ field, message }]` for inline form display. */
export function fieldErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "form",
    message: issue.message,
  }));
}

/**
 * Single funnel for everything thrown inside a route handler.
 *
 * Expected failures (AppError, Zod, known Prisma codes) become precise client
 * responses; anything else is logged and flattened to a generic 500 so internal
 * details never reach the browser.
 */
export function handleRouteError(error: unknown, context: string) {
  if (error instanceof AppError) {
    if (error.status >= 500)
      logger.error(`${context}: ${error.message}`, error);
    return fail(error.message, error.code, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return fail(
      "Validation failed",
      ErrorCode.VALIDATION_ERROR,
      400,
      fieldErrors(error)
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ");
      return fail(
        target
          ? `A record with the same ${target} already exists`
          : "That record already exists",
        ErrorCode.CONFLICT,
        409
      );
    }
    if (error.code === "P2025") {
      return fail("Resource not found", ErrorCode.NOT_FOUND, 404);
    }
    if (error.code === "P2003") {
      return fail(
        "This record is still referenced by other data",
        ErrorCode.CONFLICT,
        409
      );
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error(`${context}: database unavailable`, error);
    return fail(
      "The database is temporarily unavailable. Please try again shortly.",
      ErrorCode.INTERNAL_ERROR,
      503
    );
  }

  logger.error(`Unhandled error in ${context}`, error);
  return fail(
    "Something went wrong. Please try again later.",
    ErrorCode.INTERNAL_ERROR,
    500
  );
}
