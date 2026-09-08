// lib/http/errors.ts

/** Stable, client-facing error codes. Never renumber these. */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  OFFLINE: "OFFLINE",
  NETWORK_ERROR: "NETWORK_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * An error that is safe to show the user.
 *
 * Anything thrown that is *not* an AppError is treated as an unexpected fault:
 * it gets logged in full and reported to the client as a generic message, so
 * stack traces and SQL never leak out of the API.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCodeValue;
  readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCodeValue = ErrorCode.INTERNAL_ERROR,
    status = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
  static unauthorized(message = "Authentication required") {
    return new AppError(message, ErrorCode.UNAUTHORIZED, 401);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new AppError(message, ErrorCode.FORBIDDEN, 403);
  }
  static notFound(message = "Resource not found") {
    return new AppError(message, ErrorCode.NOT_FOUND, 404);
  }
  static conflict(message: string, details?: unknown) {
    return new AppError(message, ErrorCode.CONFLICT, 409, details);
  }
  static rateLimited(message = "Too many requests. Please slow down.") {
    return new AppError(message, ErrorCode.RATE_LIMITED, 429);
  }
}
