// lib/validation/notice.ts
import { z } from "zod";
import { paginationSchema } from "./common";

export const noticeCategories = [
  "GENERAL",
  "ACADEMIC",
  "EXAM",
  "EVENT",
  "SPORTS",
  "HOLIDAY",
  "FACILITY",
  "MEETING",
] as const;

export const noticePriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type NoticeCategoryValue = (typeof noticeCategories)[number];
export type NoticePriorityValue = (typeof noticePriorities)[number];

export const createNoticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Title must be at least 4 characters")
    .max(120, "Title cannot exceed 120 characters"),
  content: z
    .string()
    .trim()
    .min(10, "Notice body must be at least 10 characters")
    .max(4_000, "Notice body cannot exceed 4000 characters"),
  category: z.enum(noticeCategories).default("GENERAL"),
  priority: z.enum(noticePriorities).default("NORMAL"),
  authorName: z
    .string()
    .trim()
    .min(2, "Issued by must be at least 2 characters")
    .max(80, "Issued by cannot exceed 80 characters"),
  isPinned: z.boolean().default(false),
  expiresAt: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
      z.literal(""),
    ])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const updateNoticeSchema = createNoticeSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export const noticeQuerySchema = paginationSchema.extend({
  category: z.enum(noticeCategories).optional(),
  search: z.string().trim().max(80).optional(),
  includeInactive: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true")
    .optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
