export type WebhookJobStatus = "pending" | "processing" | "completed" | "failed";

export type WebhookJobSource = "kapso" | "shopify" | "internal";

export type KapsoEventType =
  | "kapso.message.received"
  | "kapso.message.sent"
  | "kapso.message.delivered"
  | "kapso.message.failed"
  | "kapso.phone_number.created";

export type WebhookEventType = KapsoEventType | `internal.${string}` | `shopify.${string}`;

// Raw webhook payload - before processing by job handler
export interface KapsoWebhookReceivedPayload {
  phoneNumberId: string;
  customerPhone: string;
  messageId: string;
  content: string;
}

// Processed response payload - after job handler parses the response
export interface KapsoMessageReceivedPayload {
  deliveryId: string;
  phoneNumber: string;
  score?: number;
  feedback?: string;
  receivedAt: string;
}

export interface KapsoMessageStatusPayload {
  deliveryId: string;
  phoneNumber: string;
  status: "sent" | "delivered" | "failed";
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface KapsoPhoneNumberCreatedPayload {
  phoneNumberId: string;
  phoneNumber: string;
  businessName: string;
  createdAt: string;
}

export type WebhookJobPayload =
  | KapsoWebhookReceivedPayload
  | KapsoMessageReceivedPayload
  | KapsoMessageStatusPayload
  | KapsoPhoneNumberCreatedPayload
  | Record<string, unknown>;

export interface EnqueueJobParams {
  orgId: string;
  idempotencyKey: string;
  source: WebhookJobSource;
  eventType: WebhookEventType;
  payload: WebhookJobPayload;
  maxAttempts?: number;
}

export interface JobHandler {
  handle(job: {
    id: string;
    orgId: string;
    eventType: string;
    payload: WebhookJobPayload;
    attempts: number;
  }): Promise<void>;
}
