// lib/utils/logger.ts
// Structured JSON logging so output stays greppable in container logs.

type LogLevel = "debug" | "info" | "warn" | "error";

const isProduction = process.env.NODE_ENV === "production";

function serialise(meta: unknown): unknown {
  if (meta instanceof Error) {
    return { name: meta.name, message: meta.message, stack: meta.stack };
  }
  return meta;
}

function write(level: LogLevel, message: string, meta?: unknown) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta === undefined ? {} : { meta: serialise(meta) }),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (!isProduction) write("debug", message, meta);
  },
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
