// lib/schemas/studentSchema.ts
import { z } from "zod";

// Define the rules for a Student
export const studentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name cannot exceed 50 characters"),

  grade: z
    .number({ error: "Grade must be a number" })
    .min(1, "Grade must be at least 1")
    .max(12, "Grade cannot be higher than 12")
    .int("Grade must be an integer"),

  section: z
    .string()
    .length(1, "Section must be a single character (e.g., 'A', 'B')")
    .optional(), // Section is not required
});

// Export the type so we can use it in our frontend later if needed
export type StudentInput = z.infer<typeof studentSchema>;
