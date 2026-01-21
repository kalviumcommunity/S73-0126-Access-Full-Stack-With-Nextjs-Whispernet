// lib/logger.ts

// Define log levels
type LogLevel = "info" | "error" | "warn" | "debug";

const formatLog = (level: LogLevel, message: string, meta?: unknown) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    // If meta is an Error object, pull out its message/stack explicitly
    meta:
      meta instanceof Error
        ? { message: meta.message, stack: meta.stack }
        : meta,
  });
};

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(formatLog("info", message, meta));
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(formatLog("warn", message, meta));
  },
  error: (message: string, meta?: unknown) => {
    console.error(formatLog("error", message, meta));
  },
  debug: (message: string, meta?: unknown) => {
    // Only log debug in development
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, meta));
    }
  },
};
