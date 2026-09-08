// lib/validation/common.ts
import { z } from "zod";

/**
 * Pagination guard.
 *
 * `limit` is capped so a crafted `?limit=999999` cannot make the server
 * materialise the whole table, and `page` has a floor so it can never produce a
 * negative OFFSET.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

/** Builds `{ total, page, limit, totalPages }` for a list response. */
export function buildMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
