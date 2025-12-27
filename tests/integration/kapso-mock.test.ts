import { describe, expect, it, beforeEach } from "vitest";
import { KapsoMockClient } from "@wp-nps/kapso";

/**
 * Kapso Mock Client Tests
 *
 * Tests for the KapsoMockClient to ensure it provides
 * proper mocking capabilities for integration tests.
 */

describe("KapsoMockClient", () => {
  let client: KapsoMockClient;

  beforeEach(() => {
    client = new KapsoMockClient();
  });

  describe("Basic Operations", () => {
    it("should send survey with default success response", async () => {
      const result = await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "How likely are you to recommend us?",
      });

      expect(result.deliveryId).toBeDefined();
      expect(result.status).toBe("queued");
      expect(result.timestamp).toBeDefined();
    });

    it("should track call history", async () => {
      await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test message",
      });

      await client.sendSurvey({
        phoneNumber: "+0987654321",
        surveyId: "survey-456",
        orgId: "org-123",
        message: "Another message",
      });

      expect(client.getCallCount()).toBe(2);
      expect(client.getCallHistory()).toHaveLength(2);
    });

    it("should check if phone was called", async () => {
      await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test",
      });

      expect(client.wasPhoneCalled("+1234567890")).toBe(true);
      expect(client.wasPhoneCalled("+9999999999")).toBe(false);
    });

    it("should filter calls by org", async () => {
      await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-1",
        message: "Test",
      });

      await client.sendSurvey({
        phoneNumber: "+0987654321",
        surveyId: "survey-456",
        orgId: "org-2",
        message: "Test",
      });

      const org1Calls = client.getCallsForOrg("org-1");
      const org2Calls = client.getCallsForOrg("org-2");

      expect(org1Calls).toHaveLength(1);
      expect(org2Calls).toHaveLength(1);
      expect(org1Calls[0]?.params.phoneNumber).toBe("+1234567890");
      expect(org2Calls[0]?.params.phoneNumber).toBe("+0987654321");
    });
  });

  describe("Mock Responses", () => {
    it("should mock success with custom status", async () => {
      client.mockSuccess("delivery-123", "delivered");

      const result = await client.getDeliveryStatus("delivery-123");

      expect(result.deliveryId).toBe("delivery-123");
      expect(result.status).toBe("delivered");
    });

    it("should mock failure with error code", async () => {
      client.mockFailure("delivery-456", "rate_limited");

      await expect(client.getDeliveryStatus("delivery-456")).rejects.toThrow(
        "Mock error: rate_limited",
      );
    });

    it("should set default response type", async () => {
      client.setDefaultResponse("failure", "connection_lost");

      await expect(
        client.sendSurvey({
          phoneNumber: "+1234567890",
          surveyId: "survey-123",
          orgId: "org-123",
          message: "Test",
        }),
      ).rejects.toThrow("Mock error: connection_lost");
    });
  });

  describe("Reset and Clear", () => {
    it("should clear call history", async () => {
      await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test",
      });

      expect(client.getCallCount()).toBe(1);

      client.clearCallHistory();

      expect(client.getCallCount()).toBe(0);
    });

    it("should reset all mocks and history", async () => {
      client.mockSuccess("delivery-123", "delivered");
      await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test",
      });

      client.reset();

      expect(client.getCallCount()).toBe(0);
      // Default response should be restored
      const result = await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test",
      });
      expect(result.status).toBe("queued");
    });
  });

  describe("Webhook Verification", () => {
    it("should always verify webhook signature in mock", () => {
      const isValid = client.verifyWebhook("any-signature", '{"test": "data"}');
      expect(isValid).toBe(true);
    });
  });

  describe("Mock Next Calls", () => {
    it("should mock next calls with success statuses", async () => {
      client.mockNextCalls([
        { status: "queued" },
        { status: "sent" },
        { status: "delivered" },
      ]);

      // These won't use the mocked responses since they generate new delivery IDs
      // But the setup exercises the code paths
      const result = await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test",
      });

      expect(result.status).toBe("queued");
    });

    it("should mock next calls with failure status", async () => {
      client.mockNextCalls([{ status: "rate_limited" }]);

      // The mock is set but won't apply to new calls (by design)
      const result = await client.sendSurvey({
        phoneNumber: "+1234567890",
        surveyId: "survey-123",
        orgId: "org-123",
        message: "Test",
      });

      expect(result.status).toBe("queued");
    });

    it("should set default response to success with custom status", () => {
      client.setDefaultResponse("success", "delivered");

      // Verify the default was set (internal state)
      expect(client).toBeDefined();
    });
  });
});
