import { z } from "zod";

export const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;

export const postcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Enter a 4-digit Australian postcode");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's full name").max(80),
  line1: z.string().trim().min(3, "Enter a street address").max(120),
  line2: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : null)),
  suburb: z.string().trim().min(2, "Enter a suburb").max(80),
  state: z.enum(AU_STATES, { message: "Select a state" }),
  postcode: postcodeSchema,
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type AddressInput = z.infer<typeof addressSchema>;
