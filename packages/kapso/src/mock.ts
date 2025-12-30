import type {
  ConnectionStatus,
  IKapsoClient,
  KapsoErrorCode,
  SendSurveyParams,
  SendTestParams,
  SetupLinkConfig,
  SetupLinkResult,
  SurveyDeliveryResult,
} from "./types";
import { KapsoError } from "./types";

/**
 * Kapso Mock Client
 *
 * A configurable mock implementation of the Kapso API client for testing.
 * Allows tests to configure specific responses for different scenarios.
 *
 * CRITICAL: NEVER use real Kapso API calls in tests. Always use KapsoMockClient.
 *
 * @example
 * ```typescript
 * const client = new KapsoMockClient();
 * client.mockSuccess('delivery-123');
 * client.mockFailure('delivery-456', 'rate_limited');
 *
 * // For WhatsApp setup link testing
 * const setupLink = await client.createSetupLink('customer-123', config);
 * client.mockSetupLinkCompleted(setupLink.id, '+5511999999999');
 * ```
 */

interface MockResponse {
  type: "success" | "failure";
  result?: SurveyDeliveryResult;
  error?: KapsoError;
}

interface SurveyCall {
  params: SendSurveyParams;
  timestamp: Date;
  deliveryId: string;
}

export class KapsoMockClient implements IKapsoClient {
  private responses: Map<string, MockResponse> = new Map();
  private defaultResponse: MockResponse;
  private callHistory: SurveyCall[] = [];
  private deliveryCounter = 0;

  private setupLinks: Map<string, SetupLinkResult> = new Map();
  private connectionStatuses: Map<string, ConnectionStatus> = new Map();
  private setupLinkCounter = 0;

  private failureSequence: number[] = [];
  private sequenceCallCount = 0;
  private permanentFailure: { enabled: boolean; message: string; code: KapsoErrorCode } | null = null;

  constructor() {
    this.defaultResponse = {
      type: "success",
      result: {
        deliveryId: "mock-delivery-default",
        status: "queued",
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Configure a successful response for a specific delivery ID
   */
  mockSuccess(deliveryId: string, status: SurveyDeliveryResult["status"] = "queued"): void {
    this.responses.set(deliveryId, {
      type: "success",
      result: {
        deliveryId,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Configure a failure response for a specific delivery ID
   */
  mockFailure(deliveryId: string, errorCode: KapsoErrorCode): void {
    this.responses.set(deliveryId, {
      type: "failure",
      error: new KapsoError(errorCode, `Mock error: ${errorCode}`),
    });
  }

  /**
   * Configure the next N calls to return specific responses
   */
  mockNextCalls(
    responses: Array<{
      status: SurveyDeliveryResult["status"] | KapsoErrorCode;
    }>,
  ): void {
    for (const response of responses) {
      const deliveryId = `mock-delivery-${++this.deliveryCounter}`;
      if (["queued", "sent", "delivered", "failed"].includes(response.status)) {
        this.mockSuccess(deliveryId, response.status as SurveyDeliveryResult["status"]);
      } else {
        this.mockFailure(deliveryId, response.status as KapsoErrorCode);
      }
    }
  }

  /**
   * Set the default response for unmocked calls
   */
  setDefaultResponse(
    type: "success" | "failure",
    statusOrError: SurveyDeliveryResult["status"] | KapsoErrorCode = "queued",
  ): void {
    if (type === "success") {
      this.defaultResponse = {
        type: "success",
        result: {
          deliveryId: `mock-delivery-${++this.deliveryCounter}`,
          status: statusOrError as SurveyDeliveryResult["status"],
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      this.defaultResponse = {
        type: "failure",
        error: new KapsoError(statusOrError as KapsoErrorCode, `Mock error: ${statusOrError}`),
      };
    }
  }

  mockFailureSequence(failAttempts: number[]): void {
    this.failureSequence = failAttempts;
    this.sequenceCallCount = 0;
  }

  mockPermanentFailure(errorCode: KapsoErrorCode = "invalid_phone", message = "Permanent failure"): void {
    this.permanentFailure = { enabled: true, message, code: errorCode };
  }

  clearFailureSequence(): void {
    this.failureSequence = [];
    this.sequenceCallCount = 0;
    this.permanentFailure = null;
  }

  async sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult> {
    const deliveryId = `mock-delivery-${++this.deliveryCounter}`;
    this.sequenceCallCount++;

    this.callHistory.push({
      params,
      timestamp: new Date(),
      deliveryId,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    if (this.permanentFailure?.enabled) {
      throw new KapsoError(this.permanentFailure.code, this.permanentFailure.message, false);
    }

    if (this.failureSequence.includes(this.sequenceCallCount)) {
      throw new KapsoError(
        "connection_lost",
        `Transient failure on attempt ${this.sequenceCallCount}`,
        true,
      );
    }

    const mockResponse = this.responses.get(deliveryId) ?? this.defaultResponse;

    if (mockResponse.type === "failure" && mockResponse.error) {
      throw mockResponse.error;
    }

    return (
      mockResponse.result ?? {
        deliveryId,
        status: "queued",
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Get delivery status (mock implementation)
   */
  async getDeliveryStatus(deliveryId: string): Promise<SurveyDeliveryResult> {
    const mockResponse = this.responses.get(deliveryId);

    if (mockResponse?.type === "failure" && mockResponse.error) {
      throw mockResponse.error;
    }

    return (
      mockResponse?.result ?? {
        deliveryId,
        status: "queued",
        timestamp: new Date().toISOString(),
      }
    );
  }

  private validSignatures: Set<string> = new Set();
  private invalidSignatures: Set<string> = new Set();
  private defaultWebhookVerification = true;

  mockValidSignature(signature: string): void {
    this.validSignatures.add(signature);
    this.invalidSignatures.delete(signature);
  }

  mockInvalidSignature(signature: string): void {
    this.invalidSignatures.add(signature);
    this.validSignatures.delete(signature);
  }

  setDefaultWebhookVerification(valid: boolean): void {
    this.defaultWebhookVerification = valid;
  }

  verifyWebhook(signature: string, _payload: string): boolean {
    if (this.invalidSignatures.has(signature)) {
      return false;
    }
    if (this.validSignatures.has(signature)) {
      return true;
    }
    return this.defaultWebhookVerification;
  }

  // ==========================================
  // Test Message Methods (WhatsApp Verification)
  // ==========================================

  private testMessageResponses: Map<string, MockResponse> = new Map();

  /**
   * Send a test message for WhatsApp verification (IKapsoClient method)
   */
  async sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult> {
    const deliveryId = `mock-test-${++this.deliveryCounter}`;

    // Record the call with test message params
    this.callHistory.push({
      params: {
        ...params,
        surveyId: "test-verification",
        message: "FlowPulse test message - if you received this, your WhatsApp is connected!",
      },
      timestamp: new Date(),
      deliveryId,
    });

    // Check for specific mock response for this delivery
    const mockResponse = this.testMessageResponses.get(deliveryId) ?? this.defaultResponse;

    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (mockResponse.type === "failure" && mockResponse.error) {
      throw mockResponse.error;
    }

    // Always use the generated deliveryId and "sent" status for test messages
    // This differs from survey sends which use "queued"
    return {
      deliveryId,
      status: "sent",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Configure test message success response
   */
  mockTestMessageSuccess(deliveryId: string): void {
    this.testMessageResponses.set(deliveryId, {
      type: "success",
      result: {
        deliveryId,
        status: "sent",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Configure test message failure response
   */
  mockTestMessageFailure(deliveryId: string, errorCode: KapsoErrorCode): void {
    this.testMessageResponses.set(deliveryId, {
      type: "failure",
      error: new KapsoError(errorCode, `Mock test error: ${errorCode}`),
    });
  }

  /**
   * Configure delivery status as confirmed/delivered (for polling)
   */
  mockDeliveryConfirmed(deliveryId: string): void {
    this.responses.set(deliveryId, {
      type: "success",
      result: {
        deliveryId,
        status: "delivered",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Clear test message responses
   */
  clearTestMessageResponses(): void {
    this.testMessageResponses.clear();
  }

  /**
   * Get the history of all calls made to this mock client
   */
  getCallHistory(): SurveyCall[] {
    return [...this.callHistory];
  }

  /**
   * Clear the call history
   */
  clearCallHistory(): void {
    this.callHistory = [];
  }

  reset(): void {
    this.responses.clear();
    this.callHistory = [];
    this.deliveryCounter = 0;
    this.setupLinks.clear();
    this.connectionStatuses.clear();
    this.setupLinkCounter = 0;
    this.testMessageResponses.clear();
    this.validSignatures.clear();
    this.invalidSignatures.clear();
    this.defaultWebhookVerification = true;
    this.failureSequence = [];
    this.sequenceCallCount = 0;
    this.permanentFailure = null;
  }

  /**
   * Get the number of calls made
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Check if a specific phone number was called
   */
  wasPhoneCalled(phoneNumber: string): boolean {
    return this.callHistory.some((call) => call.params.phoneNumber === phoneNumber);
  }

  /**
   * Get calls for a specific org
   */
  getCallsForOrg(orgId: string): SurveyCall[] {
    return this.callHistory.filter((call) => call.params.orgId === orgId);
  }

  // ==========================================
  // Setup Link / WhatsApp Connection Methods
  // ==========================================

  /**
   * Create a setup link for WhatsApp onboarding (IKapsoClient method)
   * Returns a URL that redirects user to Kapso's hosted onboarding page
   */
  async createSetupLink(customerId: string, _config: SetupLinkConfig): Promise<SetupLinkResult> {
    const setupLinkId = `mock-setup-link-${customerId}-${++this.setupLinkCounter}`;
    const result: SetupLinkResult = {
      id: setupLinkId,
      url: `https://mock-kapso.test/setup/${setupLinkId}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      status: "pending",
    };

    this.setupLinks.set(setupLinkId, result);
    this.connectionStatuses.set(setupLinkId, { status: "pending" });

    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    return result;
  }

  /**
   * Get setup link status (IKapsoClient method)
   */
  async getSetupLinkStatus(setupLinkId: string): Promise<SetupLinkResult> {
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const setupLink = this.setupLinks.get(setupLinkId);
    if (!setupLink) {
      throw new KapsoError("unknown_error", "Setup link not found");
    }

    return setupLink;
  }

  /**
   * Mock a setup link being completed (simulates user completing Facebook login)
   */
  mockSetupLinkCompleted(
    setupLinkId: string,
    phoneNumberId: string,
    displayPhoneNumber: string,
  ): void {
    const existing = this.setupLinks.get(setupLinkId);
    if (existing) {
      this.setupLinks.set(setupLinkId, {
        ...existing,
        status: "completed",
      });
    }
    this.connectionStatuses.set(setupLinkId, {
      status: "connected",
      phoneNumberId,
      displayPhoneNumber,
      connectedAt: new Date().toISOString(),
    });
  }

  /**
   * Mock a setup link expiration
   */
  mockSetupLinkExpired(setupLinkId: string): void {
    const existing = this.setupLinks.get(setupLinkId);
    if (existing) {
      this.setupLinks.set(setupLinkId, {
        ...existing,
        status: "expired",
      });
    }
    this.connectionStatuses.set(setupLinkId, {
      status: "expired",
      errorCode: "link_expired",
    });
  }

  /**
   * Mock a setup link failure
   */
  mockSetupLinkFailed(setupLinkId: string, errorCode: string): void {
    const existing = this.setupLinks.get(setupLinkId);
    if (existing) {
      this.setupLinks.set(setupLinkId, {
        ...existing,
        status: "pending", // Link stays pending, user can retry
      });
    }
    this.connectionStatuses.set(setupLinkId, {
      status: "failed",
      errorCode,
    });
  }

  /**
   * Get connection status for a setup link
   */
  getConnectionStatus(setupLinkId: string): ConnectionStatus | undefined {
    return this.connectionStatuses.get(setupLinkId);
  }

  /**
   * Get a specific setup link result by ID
   */
  getSetupLinkById(setupLinkId: string): SetupLinkResult | undefined {
    return this.setupLinks.get(setupLinkId);
  }

  /**
   * Clear all setup link state
   */
  clearSetupLinkState(): void {
    this.setupLinks.clear();
    this.connectionStatuses.clear();
    this.setupLinkCounter = 0;
  }
}
