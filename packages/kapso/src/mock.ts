import type {
  IKapsoClient,
  KapsoErrorCode,
  SendSurveyParams,
  SurveyDeliveryResult,
} from "./types";
import { KapsoError } from "./types";

/**
 * Kapso Mock Client
 *
 * A configurable mock implementation of the Kapso API client for testing.
 * Allows tests to configure specific responses for different delivery IDs.
 *
 * CRITICAL: NEVER use real Kapso API calls in tests. Always use KapsoMockClient.
 *
 * @example
 * ```typescript
 * const client = new KapsoMockClient();
 * client.mockSuccess('delivery-123');
 * client.mockFailure('delivery-456', 'rate_limited');
 *
 * // In your test
 * const result = await client.sendSurvey({ ... });
 * expect(client.getCallHistory()).toHaveLength(1);
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

  constructor() {
    // Default response is success
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
  mockSuccess(
    deliveryId: string,
    status: SurveyDeliveryResult["status"] = "queued",
  ): void {
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
      if (
        ["queued", "sent", "delivered", "failed"].includes(response.status)
      ) {
        this.mockSuccess(
          deliveryId,
          response.status as SurveyDeliveryResult["status"],
        );
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
        error: new KapsoError(
          statusOrError as KapsoErrorCode,
          `Mock error: ${statusOrError}`,
        ),
      };
    }
  }

  /**
   * Send a survey (mock implementation)
   */
  async sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult> {
    const deliveryId = `mock-delivery-${++this.deliveryCounter}`;

    // Record the call
    this.callHistory.push({
      params,
      timestamp: new Date(),
      deliveryId,
    });

    // Check for specific mock response
    const mockResponse =
      this.responses.get(deliveryId) ?? this.defaultResponse;

    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 10));

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

  /**
   * Verify webhook signature (mock always returns true)
   */
  verifyWebhook(_signature: string, _payload: string): boolean {
    return true;
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

  /**
   * Reset all mocks and history
   */
  reset(): void {
    this.responses.clear();
    this.callHistory = [];
    this.deliveryCounter = 0;
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
    return this.callHistory.some(
      (call) => call.params.phoneNumber === phoneNumber,
    );
  }

  /**
   * Get calls for a specific org
   */
  getCallsForOrg(orgId: string): SurveyCall[] {
    return this.callHistory.filter((call) => call.params.orgId === orgId);
  }
}
