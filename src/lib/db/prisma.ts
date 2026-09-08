// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

// A single client is reused across hot reloads in development; without this the
// dev server leaks a connection pool on every file change.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query-level logging is far too noisy for production log aggregation.
    log:
      process.env.NODE_ENV === "production"
        ? ["warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
