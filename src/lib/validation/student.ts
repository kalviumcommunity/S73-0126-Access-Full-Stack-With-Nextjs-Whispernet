// lib/validation/student.ts
import { z } from "zod";
import { paginationSchema } from "./common";

const gradeSchema = z.coerce
  .number({ message: "Grade must be a number" })
  .int("Grade must be a whole number")
  .min(1, "Grade must be at least 1")
  .max(12, "Grade cannot be higher than 12");

const sectionSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]$/, "Section must be a single letter (A-Z)")
  .transform((value) => value.toUpperCase());

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number");

/**
 * Treats "" from an untouched optional form field as "not provided".
 *
 * Without this, an empty text input would be stored as an empty string rather
 * than left null, and `updateStudentSchema`'s "at least one field" check could
 * not tell the two apart.
 */
function optionalText<T extends z.ZodType<string>>(schema: T) {
  return z
    .union([schema, z.literal("")])
    .optional()
    .transform((value): string | undefined =>
      value === "" || value === undefined ? undefined : value
    );
}

export const createStudentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters"),
  rollNumber: optionalText(
    z.string().trim().max(12, "Roll number cannot exceed 12 characters")
  ),
  grade: gradeSchema,
  section: sectionSchema.default("A"),
  guardianName: optionalText(
    z.string().trim().max(60, "Guardian name cannot exceed 60 characters")
  ),
  guardianPhone: optionalText(phoneSchema),
});

/** Every field optional, but at least one must be supplied. */
export const updateStudentSchema = createStudentSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export const studentQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(60).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  section: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/)
    .transform((v) => v.toUpperCase())
    .optional(),
  includeInactive: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true")
    .optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;
