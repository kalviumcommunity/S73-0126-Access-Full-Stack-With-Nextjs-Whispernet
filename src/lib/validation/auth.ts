// lib/validation/auth.ts
import { z } from "zod";
import { emailSchema, passwordSchema } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
  email: emailSchema,
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  // `role` is deliberately absent: it is assigned by the server, never sent by
  // the client. Accepting it here would let anyone register as an admin.
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
  action: z.enum(["login", "signup"]).default("login"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
