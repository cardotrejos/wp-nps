import { createHmac, timingSafeEqual } from "node:crypto";
import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import type {
  CreateCustomerParams,
  IKapsoClient,
  KapsoCustomer,
  SendSurveyParams,
  SendTestParams,
  SetupLinkConfig,
  SetupLinkResult,
  SurveyDeliveryResult,
} from "./types";
import { KapsoError, setupLinkResultSchema } from "./types";

const KAPSO_WHATSAPP_API_URL = "https://api.kapso.ai/meta/whatsapp";
const KAPSO_PLATFORM_API_URL = "https://api.kapso.ai/platform/v1";

/**
 * Configuration for the real Kapso client
 */
export interface KapsoClientConfig {
  /** Kapso API key for authentication */
  apiKey: string;
  /** Secret for webhook signature verification (Meta app secret) */
  webhookSecret: string;
  /** Base URL for WhatsApp Cloud API (defaults to Kapso proxy) */
  baseUrl?: string;
  /** Base URL for Kapso Platform API (setup links, customers) */
  platformBaseUrl?: string;
}

/**
 * Real Kapso client implementation using the official Kapso SDK
 *
 * Uses @kapso/whatsapp-cloud-api for WhatsApp operations and
 * fetch for Platform API operations (setup links).
 *
 * @example
 * ```typescript
 * const client = new KapsoClient({
 *   apiKey: process.env.KAPSO_API_KEY!,
 *   webhookSecret: process.env.KAPSO_WEBHOOK_SECRET!,
 * });
 *
 * await client.sendSurvey({
 *   phoneNumber: '+5511999999999',
 *   surveyId: 'survey-123',
 *   orgId: 'phone-number-id',
 *   message: 'How likely are you to recommend us?',
 * });
 * ```
 */
export class KapsoClient implements IKapsoClient {
  private whatsappClient: WhatsAppClient;
  private webhookSecret: string;
  private platformBaseUrl: string;
  private apiKey: string;

  constructor(config: KapsoClientConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
    this.platformBaseUrl = config.platformBaseUrl ?? KAPSO_PLATFORM_API_URL;

    this.whatsappClient = new WhatsAppClient({
      baseUrl: config.baseUrl ?? KAPSO_WHATSAPP_API_URL,
      kapsoApiKey: config.apiKey,
    });
  }

  /**
   * Send a survey message to a phone number
   *
   * @param params - Survey send parameters including phone, message, and org's phoneNumberId
   * @returns Delivery result with deliveryId and status
   */
  async sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult> {
    try {
      const response = await this.whatsappClient.messages.sendText({
        phoneNumberId: params.orgId,
        to: params.phoneNumber,
        body: params.message,
      });

      const messageId = response.messages[0]?.id;
      if (!messageId) {
        throw new KapsoError("message_failed", "No message ID returned from Kapso");
      }

      return {
        deliveryId: messageId,
        status: "queued",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof KapsoError) {
        throw error;
      }
      throw new KapsoError(
        "message_failed",
        error instanceof Error ? error.message : "Unknown error sending survey",
      );
    }
  }

  /**
   * Send a test message to verify WhatsApp connection
   *
   * @param params - Test message parameters including phone and org's phoneNumberId
   * @returns Delivery result with deliveryId and status
   */
  async sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult> {
    try {
      const response = await this.whatsappClient.messages.sendText({
        phoneNumberId: params.orgId,
        to: params.phoneNumber,
        body: "FlowPulse test message - if you received this, your WhatsApp is connected!",
      });

      const messageId = response.messages[0]?.id;
      if (!messageId) {
        throw new KapsoError("test_message_failed", "No message ID returned from Kapso");
      }

      return {
        deliveryId: messageId,
        status: "sent",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof KapsoError) {
        throw error;
      }
      throw new KapsoError(
        "test_message_failed",
        error instanceof Error ? error.message : "Unknown error sending test message",
      );
    }
  }

  /**
   * Get delivery status for a message
   *
   * Note: Kapso doesn't provide a direct status endpoint.
   * Status updates come via webhooks. This method returns
   * a placeholder - actual status tracking should use webhook events.
   *
   * @param deliveryId - The message ID to check status for
   * @returns Delivery result with current status
   */
  async getDeliveryStatus(deliveryId: string): Promise<SurveyDeliveryResult> {
    return {
      deliveryId,
      status: "queued",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify Kapso Platform webhook signature using HMAC-SHA256
   *
   * Kapso signs webhooks with HMAC-SHA256 and includes the signature
   * in the X-Webhook-Signature header as a hex string.
   *
   * @param signature - The X-Webhook-Signature header value (hex)
   * @param payload - The raw request body as JSON string
   * @returns true if signature is valid
   */
  verifyWebhook(signature: string, payload: string): boolean {
    try {
      const expectedSignature = createHmac("sha256", this.webhookSecret)
        .update(payload)
        .digest("hex");

      // Use timing-safe comparison to prevent timing attacks
      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  async createCustomer(params: CreateCustomerParams): Promise<KapsoCustomer> {
    const response = await fetch(`${this.platformBaseUrl}/customers`, {
      method: "POST",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: {
          name: params.name,
          external_customer_id: params.externalCustomerId,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new KapsoError("unknown_error", `Failed to create customer: ${response.status} ${text}`, true);
    }

    const json = (await response.json()) as { data: { id: string; name: string; external_customer_id: string } };
    return {
      id: json.data.id,
      name: json.data.name,
      externalCustomerId: json.data.external_customer_id,
    };
  }

  async getCustomerByExternalId(externalId: string): Promise<KapsoCustomer | null> {
    const response = await fetch(
      `${this.platformBaseUrl}/customers?external_customer_id=${encodeURIComponent(externalId)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      const text = await response.text();
      throw new KapsoError("unknown_error", `Failed to get customer: ${response.status} ${text}`, true);
    }

    type CustomerData = { id: string; name: string; external_customer_id: string };
    const json = (await response.json()) as { data: CustomerData[] };
    const customer = json.data?.[0];
    if (!customer) return null;

    return {
      id: customer.id,
      name: customer.name,
      externalCustomerId: customer.external_customer_id,
    };
  }

  async getOrCreateCustomer(params: CreateCustomerParams): Promise<KapsoCustomer> {
    const existing = await this.getCustomerByExternalId(params.externalCustomerId);
    if (existing) return existing;
    return this.createCustomer(params);
  }

  async createSetupLink(customerId: string, config: SetupLinkConfig): Promise<SetupLinkResult> {
    const response = await fetch(`${this.platformBaseUrl}/customers/${customerId}/setup_links`, {
      method: "POST",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        setup_link: {
          success_redirect_url: config.successRedirectUrl,
          failure_redirect_url: config.failureRedirectUrl,
          allowed_connection_types: config.allowedConnectionTypes,
          provision_phone_number: config.provisionPhoneNumber,
          phone_number_country_isos: config.phoneNumberCountryIsos,
          theme_config: config.themeConfig
            ? {
                primary_color: config.themeConfig.primaryColor,
                background_color: config.themeConfig.backgroundColor,
                text_color: config.themeConfig.textColor,
              }
            : undefined,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new KapsoError(
        "unknown_error",
        `Failed to create setup link: ${response.status} ${text}`,
      );
    }

    const json = (await response.json()) as { data: Record<string, unknown> };

    const parsed = setupLinkResultSchema.safeParse({
      id: json.data.id,
      url: json.data.url,
      expiresAt: json.data.expires_at,
      status: json.data.status ?? "pending",
    });

    if (!parsed.success) {
      throw new KapsoError(
        "unknown_error",
        `Invalid setup link response from Kapso: ${parsed.error.message}`,
      );
    }

    return parsed.data;
  }

  async getSetupLinkStatus(setupLinkId: string): Promise<SetupLinkResult> {
    const response = await fetch(`${this.platformBaseUrl}/setup_links/${setupLinkId}`, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new KapsoError(
        "unknown_error",
        `Failed to get setup link status: ${response.status} ${text}`,
      );
    }

    const json = (await response.json()) as { data: Record<string, unknown> };

    const parsed = setupLinkResultSchema.safeParse({
      id: json.data.id,
      url: json.data.url,
      expiresAt: json.data.expires_at,
      status: json.data.status,
    });

    if (!parsed.success) {
      throw new KapsoError(
        "unknown_error",
        `Invalid setup link response from Kapso: ${parsed.error.message}`,
      );
    }

    return parsed.data;
  }
}
