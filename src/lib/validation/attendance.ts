// lib/validation/attendance.ts
import { z } from "zod";

export const attendanceStatuses = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;

export type AttendanceStatusValue = (typeof attendanceStatuses)[number];

/** `YYYY-MM-DD`, the only date shape the attendance API accepts. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
    message: "Enter a real calendar date",
  });

export const attendanceQuerySchema = z.object({
  date: isoDateSchema,
  grade: z.coerce.number().int().min(1).max(12),
  section: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/, "Section must be a single letter")
    .transform((v) => v.toUpperCase()),
});

export const markAttendanceSchema = z.object({
  date: isoDateSchema,
  records: z
    .array(
      z.object({
        studentId: z.coerce.number().int().positive(),
        status: z.enum(attendanceStatuses),
        note: z
          .union([z.string().trim().max(200), z.literal("")])
          .optional()
          .transform((value) => (value === "" ? undefined : value)),
      })
    )
    .min(1, "Mark at least one student")
    .max(200, "Too many records in a single submission"),
});

export const attendanceHistorySchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  section: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/)
    .transform((v) => v.toUpperCase())
    .optional(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

/**
 * Parses `YYYY-MM-DD` into midnight UTC.
 *
 * Attendance is a calendar fact, not an instant: pinning it to UTC midnight
 * keeps "today" identical no matter what timezone the server runs in.
 */
export function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** Formats a Date back to `YYYY-MM-DD` in UTC. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's calendar date in `YYYY-MM-DD`, UTC. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** `YYYY-MM-DD` for `days` before today, used for history ranges. */
export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return toIsoDate(date);
}
