import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export const createUserSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(120).optional(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number"),
  role: z.enum(["ADMIN", "STAFF", "VIEWER"]),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().cuid(),
  active: z.boolean(),
});
