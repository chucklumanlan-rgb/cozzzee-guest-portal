import * as z from "zod";

export const passportUploadSchema = z.object({
  passport: z.any(),
});

export const termsSchema = z.object({
  accepted: z.literal(true),
});

export const signatureSchema = z.object({
  signature: z.string().min(10, "Signature required"),
});