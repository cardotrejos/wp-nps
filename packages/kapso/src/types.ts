import { z } from "zod";

/**
 * Kapso API Types
 * These types define the contract with the Kapso WhatsApp integration service
 */

// Survey send parameters
export const sendSurveyParamsSchema = z.object({
  phoneNumber: z.string(),
  surveyId: z.string(),
  orgId: z.string(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type SendSurveyParams = z.infer<typeof sendSurveyParamsSchema>;

// Survey delivery result
export const surveyDeliveryResultSchema = z.object({
  deliveryId: z.string(),
  status: z.enum(["queued", "sent", "delivered", "failed"]),
  timestamp: z.string().datetime(),
  error: z.string().optional(),
});

export type SurveyDeliveryResult = z.infer<typeof surveyDeliveryResultSchema>;

// Kapso error codes
export const kapsoErrorCodeSchema = z.enum([
  "rate_limited",
  "invalid_phone",
  "connection_lost",
  "message_failed",
  "unknown_error",
]);

export type KapsoErrorCode = z.infer<typeof kapsoErrorCodeSchema>;

// Kapso error
export class KapsoError extends Error {
  constructor(
    public readonly code: KapsoErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "KapsoError";
  }
}

// Webhook payload from Kapso
export const kapsoWebhookPayloadSchema = z.object({
  eventType: z.enum([
    "message.sent",
    "message.delivered",
    "message.read",
    "message.failed",
    "response.received",
  ]),
  deliveryId: z.string(),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
});

export type KapsoWebhookPayload = z.infer<typeof kapsoWebhookPayloadSchema>;

// Client interface for Kapso operations
export interface IKapsoClient {
  sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult>;
  getDeliveryStatus(deliveryId: string): Promise<SurveyDeliveryResult>;
  verifyWebhook(signature: string, payload: string): boolean;
}
