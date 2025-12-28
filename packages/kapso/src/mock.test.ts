import { describe, expect, it, beforeEach } from "vitest";
import { KapsoMockClient } from "./mock";
import type { SetupLinkConfig } from "./types";

describe("KapsoMockClient - Setup Link Operations", () => {
  let client: KapsoMockClient;

  const defaultConfig: SetupLinkConfig = {
    successRedirectUrl: "https://app.flowpulse.test/onboarding/whatsapp/success",
    failureRedirectUrl: "https://app.flowpulse.test/onboarding/whatsapp/failed",
  };

  beforeEach(() => {
    client = new KapsoMockClient();
  });

  describe("createSetupLink", () => {
    it("generates setup link with valid URL and ID", async () => {
      const customerId = "customer-123";
      const result = await client.createSetupLink(customerId, defaultConfig);

      expect(result.id).toContain("mock-setup-link-");
      expect(result.id).toContain(customerId);
      expect(result.url).toContain("mock-kapso.test/setup/");
      expect(result.status).toBe("pending");
      expect(result.expiresAt).toBeDefined();
    });

    it("sets initial connection status to pending", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);
      const status = client.getConnectionStatus(result.id);

      expect(status?.status).toBe("pending");
      expect(status?.phoneNumberId).toBeUndefined();
    });

    it("generates unique IDs for different calls", async () => {
      const result1 = await client.createSetupLink("customer-123", defaultConfig);
      const result2 = await client.createSetupLink("customer-123", defaultConfig);

      expect(result1.id).not.toBe(result2.id);
    });

    it("expires approximately 30 days in the future", async () => {
      const before = Date.now();
      const result = await client.createSetupLink("customer-123", defaultConfig);
      const expiresAt = new Date(result.expiresAt).getTime();
      const after = Date.now();

      // Should expire ~30 days from now (with some tolerance)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThan(before + thirtyDaysMs - 60_000);
      expect(expiresAt).toBeLessThan(after + thirtyDaysMs + 60_000);
    });
  });

  describe("getSetupLinkStatus", () => {
    it("returns the setup link status", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);
      const status = await client.getSetupLinkStatus(result.id);

      expect(status.id).toBe(result.id);
      expect(status.status).toBe("pending");
    });

    it("throws error for unknown setup link", async () => {
      await expect(client.getSetupLinkStatus("unknown-setup-link")).rejects.toThrow(
        "Setup link not found",
      );
    });
  });

  describe("mockSetupLinkCompleted", () => {
    it("updates status to connected after completion", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);
      const phoneNumberId = "wamid.1234567890";
      const displayPhoneNumber = "+5511999999999";

      client.mockSetupLinkCompleted(result.id, phoneNumberId, displayPhoneNumber);

      const connectionStatus = client.getConnectionStatus(result.id);
      expect(connectionStatus?.status).toBe("connected");
      expect(connectionStatus?.phoneNumberId).toBe(phoneNumberId);
      expect(connectionStatus?.displayPhoneNumber).toBe(displayPhoneNumber);
      expect(connectionStatus?.connectedAt).toBeDefined();

      const setupLink = await client.getSetupLinkStatus(result.id);
      expect(setupLink.status).toBe("completed");
    });
  });

  describe("mockSetupLinkExpired", () => {
    it("updates status to expired", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);

      client.mockSetupLinkExpired(result.id);

      const connectionStatus = client.getConnectionStatus(result.id);
      expect(connectionStatus?.status).toBe("expired");
      expect(connectionStatus?.errorCode).toBe("link_expired");

      const setupLink = await client.getSetupLinkStatus(result.id);
      expect(setupLink.status).toBe("expired");
    });
  });

  describe("mockSetupLinkFailed", () => {
    it("updates connection status to failed with error code", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);
      const errorCode = "user_cancelled";

      client.mockSetupLinkFailed(result.id, errorCode);

      const connectionStatus = client.getConnectionStatus(result.id);
      expect(connectionStatus?.status).toBe("failed");
      expect(connectionStatus?.errorCode).toBe(errorCode);
    });
  });

  describe("getSetupLinkById", () => {
    it("returns setup link by ID", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);

      const stored = client.getSetupLinkById(result.id);
      expect(stored?.id).toBe(result.id);
      expect(stored?.url).toBe(result.url);
    });

    it("returns undefined for unknown ID", () => {
      const stored = client.getSetupLinkById("unknown-id");
      expect(stored).toBeUndefined();
    });
  });

  describe("clearSetupLinkState", () => {
    it("removes all setup links and connection statuses", async () => {
      const result1 = await client.createSetupLink("customer-1", defaultConfig);
      const result2 = await client.createSetupLink("customer-2", defaultConfig);

      client.mockSetupLinkCompleted(result1.id, "wamid.1", "+5511111111111");

      // Clear state
      client.clearSetupLinkState();

      // Both should now be undefined
      expect(client.getSetupLinkById(result1.id)).toBeUndefined();
      expect(client.getSetupLinkById(result2.id)).toBeUndefined();
      expect(client.getConnectionStatus(result1.id)).toBeUndefined();
      expect(client.getConnectionStatus(result2.id)).toBeUndefined();
    });
  });

  describe("reset", () => {
    it("clears setup link state along with other state", async () => {
      const result = await client.createSetupLink("customer-123", defaultConfig);
      client.mockSetupLinkCompleted(result.id, "wamid.1", "+5511999999999");

      client.reset();

      expect(client.getSetupLinkById(result.id)).toBeUndefined();
      expect(client.getConnectionStatus(result.id)).toBeUndefined();
    });
  });
});

describe("KapsoMockClient - Test Message Operations", () => {
  let client: KapsoMockClient;

  beforeEach(() => {
    client = new KapsoMockClient();
  });

  describe("sendTestMessage", () => {
    it("sends test message and returns delivery result", async () => {
      const result = await client.sendTestMessage({
        phoneNumber: "+5511999999999",
        orgId: "org-123",
      });

      expect(result.deliveryId).toContain("mock-test-");
      expect(result.status).toBe("sent");
      expect(result.timestamp).toBeDefined();
    });

    it("records test message in call history", async () => {
      await client.sendTestMessage({
        phoneNumber: "+5511999999999",
        orgId: "org-123",
      });

      const history = client.getCallHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.params.phoneNumber).toBe("+5511999999999");
      expect(history[0]?.params.orgId).toBe("org-123");
      expect(history[0]?.params.surveyId).toBe("test-verification");
    });

    it("allows checking if phone was called", async () => {
      await client.sendTestMessage({
        phoneNumber: "+5511888888888",
        orgId: "org-123",
      });

      expect(client.wasPhoneCalled("+5511888888888")).toBe(true);
      expect(client.wasPhoneCalled("+5511777777777")).toBe(false);
    });
  });

  describe("mockTestMessageSuccess", () => {
    it("configures successful test message response", async () => {
      client.mockTestMessageSuccess("mock-test-1");

      // The mock success is set for a specific deliveryId
      // For testing, we verify the mock is stored correctly
      await client.sendTestMessage({
        phoneNumber: "+5511999999999",
        orgId: "org-123",
      });

      // First call creates mock-test-1
      expect(client.getCallCount()).toBe(1);
    });
  });

  describe("mockTestMessageFailure", () => {
    it("configures failure test message response", async () => {
      // Set default response to failure
      client.setDefaultResponse("failure", "test_message_failed");

      await expect(
        client.sendTestMessage({
          phoneNumber: "+5511999999999",
          orgId: "org-123",
        }),
      ).rejects.toThrow("test_message_failed");
    });

    it("configures phone_not_connected error", async () => {
      client.setDefaultResponse("failure", "phone_not_connected");

      await expect(
        client.sendTestMessage({
          phoneNumber: "+5511999999999",
          orgId: "org-123",
        }),
      ).rejects.toThrow("phone_not_connected");
    });
  });

  describe("mockDeliveryConfirmed", () => {
    it("updates delivery status to delivered for polling", async () => {
      const testResult = await client.sendTestMessage({
        phoneNumber: "+5511999999999",
        orgId: "org-123",
      });

      // Initially status would be queued from getDeliveryStatus
      const initialStatus = await client.getDeliveryStatus(testResult.deliveryId);
      expect(initialStatus.status).toBe("queued");

      // Mock delivery confirmation
      client.mockDeliveryConfirmed(testResult.deliveryId);

      // Now status should be delivered
      const confirmedStatus = await client.getDeliveryStatus(testResult.deliveryId);
      expect(confirmedStatus.status).toBe("delivered");
    });
  });

  describe("clearTestMessageResponses", () => {
    it("clears test message mock responses", async () => {
      client.mockTestMessageSuccess("mock-test-1");
      client.clearTestMessageResponses();

      // After clearing, new calls use default response
      const result = await client.sendTestMessage({
        phoneNumber: "+5511999999999",
        orgId: "org-123",
      });

      expect(result.status).toBe("sent");
    });
  });

  describe("reset", () => {
    it("clears test message responses along with other state", async () => {
      await client.sendTestMessage({
        phoneNumber: "+5511999999999",
        orgId: "org-123",
      });

      expect(client.getCallCount()).toBe(1);

      client.reset();

      expect(client.getCallCount()).toBe(0);
    });
  });
});

describe("KapsoMockClient - Survey Operations", () => {
  let client: KapsoMockClient;

  beforeEach(() => {
    client = new KapsoMockClient();
  });

  describe("sendSurvey", () => {
    it("returns a successful delivery result by default", async () => {
      const result = await client.sendSurvey({
        phoneNumber: "+5511999999999",
        surveyId: "survey-123",
        orgId: "org-456",
        message: "Please rate your experience",
      });

      expect(result.deliveryId).toContain("mock-delivery-");
      expect(result.status).toBe("queued");
      expect(result.timestamp).toBeDefined();
    });

    it("records call in history", async () => {
      const params = {
        phoneNumber: "+5511999999999",
        surveyId: "survey-123",
        orgId: "org-456",
        message: "Test message",
      };

      await client.sendSurvey(params);

      const history = client.getCallHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.params).toEqual(params);
    });
  });

  describe("mockSuccess/mockFailure", () => {
    it("mockSuccess configures successful response", async () => {
      client.mockSuccess("delivery-123", "delivered");
      const result = await client.getDeliveryStatus("delivery-123");

      expect(result.status).toBe("delivered");
    });

    it("mockFailure configures error response", async () => {
      client.mockFailure("delivery-456", "rate_limited");

      await expect(client.getDeliveryStatus("delivery-456")).rejects.toThrow("rate_limited");
    });
  });

  describe("utility methods", () => {
    it("wasPhoneCalled returns true if phone was called", async () => {
      const phone = "+5511888888888";
      await client.sendSurvey({
        phoneNumber: phone,
        surveyId: "survey-1",
        orgId: "org-1",
        message: "Test",
      });

      expect(client.wasPhoneCalled(phone)).toBe(true);
      expect(client.wasPhoneCalled("+5511777777777")).toBe(false);
    });

    it("getCallsForOrg returns calls for specific org", async () => {
      await client.sendSurvey({
        phoneNumber: "+5511111111111",
        surveyId: "survey-1",
        orgId: "org-A",
        message: "Test A",
      });
      await client.sendSurvey({
        phoneNumber: "+5511222222222",
        surveyId: "survey-2",
        orgId: "org-B",
        message: "Test B",
      });

      const callsA = client.getCallsForOrg("org-A");
      const callsB = client.getCallsForOrg("org-B");

      expect(callsA).toHaveLength(1);
      expect(callsB).toHaveLength(1);
      expect(callsA[0]?.params.phoneNumber).toBe("+5511111111111");
    });
  });
});
