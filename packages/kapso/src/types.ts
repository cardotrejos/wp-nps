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
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SendSurveyParams = z.infer<typeof sendSurveyParamsSchema>;

// Test message parameters (for WhatsApp verification)
export const sendTestParamsSchema = z.object({
  phoneNumber: z.string(),
  orgId: z.string(),
});

export type SendTestParams = z.infer<typeof sendTestParamsSchema>;

export const sendFlowParamsSchema = z.object({
  phoneNumber: z.string(),
  orgId: z.string(),
  flowId: z.string(),
  flowCta: z.string().default("Start Survey"),
  bodyText: z.string().default("Please complete this survey"),
  flowAction: z.enum(["navigate", "data_exchange"]).default("navigate"),
  initialScreen: z.string().optional(),
  initialData: z.record(z.string(), z.unknown()).optional(),
});

export type SendFlowParams = z.infer<typeof sendFlowParamsSchema>;

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
  "qr_expired",
  "qr_generation_failed",
  "test_message_failed",
  "phone_not_connected",
]);

export type KapsoErrorCode = z.infer<typeof kapsoErrorCodeSchema>;

const TRANSIENT_ERROR_CODES: Set<KapsoErrorCode> = new Set([
  "rate_limited",
  "connection_lost",
  "unknown_error",
]);

export class KapsoError extends Error {
  public readonly isRetryable: boolean;

  constructor(
    public readonly code: KapsoErrorCode,
    message: string,
    isRetryable?: boolean,
  ) {
    super(message);
    this.name = "KapsoError";
    this.isRetryable = isRetryable ?? TRANSIENT_ERROR_CODES.has(code);
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
  data: z.record(z.string(), z.unknown()),
});

export type KapsoWebhookPayload = z.infer<typeof kapsoWebhookPayloadSchema>;

// Setup Link configuration for WhatsApp onboarding
export const setupLinkConfigSchema = z.object({
  successRedirectUrl: z.url(),
  failureRedirectUrl: z.url(),
  allowedConnectionTypes: z.array(z.enum(["coexistence", "dedicated"])).optional(),
  provisionPhoneNumber: z.boolean().optional(),
  phoneNumberCountryIsos: z.array(z.string()).optional(),
  themeConfig: z
    .object({
      primaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
});

export type SetupLinkConfig = z.infer<typeof setupLinkConfigSchema>;

export const setupLinkResultSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  expiresAt: z.string(),
  status: z.string().optional(),
});

export type SetupLinkResult = z.infer<typeof setupLinkResultSchema>;

// Connection status from Kapso (via webhook or redirect params)
export const connectionStatusSchema = z.object({
  status: z.enum(["pending", "connected", "failed", "expired"]),
  phoneNumberId: z.string().optional(),
  displayPhoneNumber: z.string().optional(),
  businessAccountId: z.string().optional(),
  connectedAt: z.string().datetime().optional(),
  errorCode: z.string().optional(),
});

export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

export interface CreateCustomerParams {
  name: string;
  externalCustomerId: string;
}

export interface KapsoCustomer {
  id: string;
  name: string;
  externalCustomerId: string;
}

export interface IKapsoClient {
  // Survey operations
  sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult>;
  getDeliveryStatus(deliveryId: string): Promise<SurveyDeliveryResult>;
  verifyWebhook(signature: string, payload: string): boolean;

  // Customer operations
  createCustomer(params: CreateCustomerParams): Promise<KapsoCustomer>;
  getCustomerByExternalId(externalId: string): Promise<KapsoCustomer | null>;
  getOrCreateCustomer(params: CreateCustomerParams): Promise<KapsoCustomer>;

  // Setup Link / WhatsApp connection operations
  createSetupLink(customerId: string, config: SetupLinkConfig): Promise<SetupLinkResult>;
  getSetupLinkStatus(setupLinkId: string): Promise<SetupLinkResult>;

  // Test message for WhatsApp verification
  sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult>;

  // Send WhatsApp Flow (interactive survey)
  sendFlow(params: SendFlowParams): Promise<SurveyDeliveryResult>;
}
