import { z } from "zod";

const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +5511999999999)");

export const surveySendRequestSchema = z.object({
  phone: phoneE164Schema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const surveySendResponseSchema = z.object({
  delivery_id: z.string(),
  status: z.literal("queued"),
  message: z.string(),
});

export type SurveySendRequest = z.infer<typeof surveySendRequestSchema>;
export type SurveySendResponse = z.infer<typeof surveySendResponseSchema>;
