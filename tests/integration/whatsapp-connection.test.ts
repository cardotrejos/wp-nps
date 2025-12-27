import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { whatsappConnection } from "@wp-nps/db/schema/flowpulse";
import { KapsoMockClient, type SetupLinkConfig } from "@wp-nps/kapso";
import {
  createTestOrg,
  cleanupTestOrg,
  clearOrgContext,
} from "../utils/test-org";

/**
 * WhatsApp Connection Integration Tests
 * Story 1.2: WhatsApp Connection via Setup Links
 *
 * Tests the core connection flows at the database and Kapso mock level.
 * Uses Kapso Setup Links (not QR codes) for WhatsApp Business connection.
 */

const defaultConfig: SetupLinkConfig = {
  successRedirectUrl: "https://app.flowpulse.test/onboarding/whatsapp/success",
  failureRedirectUrl: "https://app.flowpulse.test/onboarding/whatsapp/failed",
};

describe("WhatsApp Connection Flow", () => {
  let kapsoClient: KapsoMockClient;
  let testOrgId: string;

  beforeEach(async () => {
    await clearOrgContext();
    kapsoClient = new KapsoMockClient();

    // Create test organization
    const org = await createTestOrg(`WhatsApp Test Org ${Date.now()}`);
    testOrgId = org.id;
  });

  afterEach(async () => {
    try {
      // Clean up any whatsapp_connection records for test org
      await db
        .delete(whatsappConnection)
        .where(eq(whatsappConnection.orgId, testOrgId));
      await cleanupTestOrg(testOrgId);
    } catch {
      // Ignore cleanup errors
    }
    await clearOrgContext();
  });

  describe("AC #1: Setup Link Generation", () => {
    it("generates setup link with valid URL and ID", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );

      expect(setupLink.id).toContain("mock-setup-link-");
      expect(setupLink.url).toContain("mock-kapso.test/setup/");
      expect(setupLink.status).toBe("pending");
      expect(setupLink.expiresAt).toBeDefined();
    });

    it("returns setup link expiring in approximately 30 days", async () => {
      const before = Date.now();
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );
      const expiresAt = new Date(setupLink.expiresAt).getTime();
      const after = Date.now();

      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      // Should expire ~30 days from now (with tolerance)
      expect(expiresAt).toBeGreaterThan(before + thirtyDaysMs - 60_000);
      expect(expiresAt).toBeLessThan(after + thirtyDaysMs + 60_000);
    });

    it("generates unique IDs for each request", async () => {
      const link1 = await kapsoClient.createSetupLink(testOrgId, defaultConfig);
      const link2 = await kapsoClient.createSetupLink(testOrgId, defaultConfig);

      expect(link1.id).not.toBe(link2.id);
    });
  });

  describe("AC #2: Connection Success", () => {
    it("updates connection status to connected with phone number", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );
      const phoneNumberId = "wamid.1234567890";
      const displayPhoneNumber = "+5511999999999";

      // Simulate successful Facebook login and WhatsApp connection
      kapsoClient.mockSetupLinkCompleted(
        setupLink.id,
        phoneNumberId,
        displayPhoneNumber,
      );

      const status = kapsoClient.getConnectionStatus(setupLink.id);

      expect(status?.status).toBe("connected");
      expect(status?.phoneNumberId).toBe(phoneNumberId);
      expect(status?.displayPhoneNumber).toBe(displayPhoneNumber);
      expect(status?.connectedAt).toBeDefined();
    });

    it("stores phone number in E.164 format", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );
      const displayPhoneNumber = "+5511999999999"; // E.164 format

      kapsoClient.mockSetupLinkCompleted(
        setupLink.id,
        "wamid.123",
        displayPhoneNumber,
      );
      const status = kapsoClient.getConnectionStatus(setupLink.id);

      // Verify E.164 format (starts with +, country code, number)
      expect(status?.displayPhoneNumber).toMatch(/^\+\d{10,15}$/);
    });
  });

  describe("AC #3: Expiration Handling", () => {
    it("returns expired status after expiration", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );

      // Simulate expiration
      kapsoClient.mockSetupLinkExpired(setupLink.id);

      const status = kapsoClient.getConnectionStatus(setupLink.id);

      expect(status?.status).toBe("expired");
      expect(status?.errorCode).toBe("link_expired");
    });
  });

  describe("AC #4: Status Checking", () => {
    it("returns pending status initially", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );

      const status = kapsoClient.getConnectionStatus(setupLink.id);

      expect(status?.status).toBe("pending");
    });

    it("detects status change from pending to connected", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );

      // Initial status is pending
      const pendingStatus = kapsoClient.getConnectionStatus(setupLink.id);
      expect(pendingStatus?.status).toBe("pending");

      // Simulate connection
      kapsoClient.mockSetupLinkCompleted(
        setupLink.id,
        "wamid.123",
        "+5511999999999",
      );

      // Status should now be connected
      const connectedStatus = kapsoClient.getConnectionStatus(setupLink.id);
      expect(connectedStatus?.status).toBe("connected");
    });
  });

  describe("Setup Link Status API", () => {
    it("getSetupLinkStatus returns link status", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );

      const status = await kapsoClient.getSetupLinkStatus(setupLink.id);

      expect(status.id).toBe(setupLink.id);
      expect(status.status).toBe("pending");
    });

    it("getSetupLinkStatus throws for unknown ID", async () => {
      await expect(
        kapsoClient.getSetupLinkStatus("unknown-setup-link"),
      ).rejects.toThrow("Setup link not found");
    });

    it("getSetupLinkStatus reflects completed status", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );
      kapsoClient.mockSetupLinkCompleted(
        setupLink.id,
        "wamid.123",
        "+5511999999999",
      );

      const status = await kapsoClient.getSetupLinkStatus(setupLink.id);
      expect(status.status).toBe("completed");
    });
  });

  describe("Database Integration", () => {
    it("creates pending connection record in database", async () => {
      // Insert pending connection
      await db.insert(whatsappConnection).values({
        orgId: testOrgId,
        status: "pending",
        kapsoId: "test-setup-link-123",
      });

      const connection = await db.query.whatsappConnection.findFirst({
        where: eq(whatsappConnection.orgId, testOrgId),
      });

      expect(connection).toBeDefined();
      expect(connection?.status).toBe("pending");
      expect(connection?.kapsoId).toBe("test-setup-link-123");
    });

    it("updates connection to active on success", async () => {
      // Insert pending connection
      await db.insert(whatsappConnection).values({
        orgId: testOrgId,
        status: "pending",
        kapsoId: "test-setup-link-456",
      });

      // Update to active with phone info
      await db
        .update(whatsappConnection)
        .set({
          status: "active",
          phoneNumber: "+5511999999999",
          metadata: {
            phoneNumberId: "wamid.1234567890",
            businessAccountId: "biz.123",
          },
          connectedAt: new Date(),
        })
        .where(eq(whatsappConnection.orgId, testOrgId));

      const connection = await db.query.whatsappConnection.findFirst({
        where: eq(whatsappConnection.orgId, testOrgId),
      });

      expect(connection?.status).toBe("active");
      expect(connection?.phoneNumber).toBe("+5511999999999");
      expect(connection?.connectedAt).toBeDefined();
      expect(connection?.metadata).toEqual({
        phoneNumberId: "wamid.1234567890",
        businessAccountId: "biz.123",
      });
    });
  });

  describe("Multi-Tenant Isolation (AR8, AR11)", () => {
    it("each organization has separate connection records", async () => {
      const org2 = await createTestOrg(`WhatsApp Test Org 2 ${Date.now()}`);

      try {
        // Create connection for org1
        await db.insert(whatsappConnection).values({
          orgId: testOrgId,
          status: "active",
          phoneNumber: "+5511111111111",
        });

        // Create connection for org2
        await db.insert(whatsappConnection).values({
          orgId: org2.id,
          status: "active",
          phoneNumber: "+5522222222222",
        });

        // Query for org1 should only return org1's connection
        const org1Connection = await db.query.whatsappConnection.findFirst({
          where: eq(whatsappConnection.orgId, testOrgId),
        });

        // Query for org2 should only return org2's connection
        const org2Connection = await db.query.whatsappConnection.findFirst({
          where: eq(whatsappConnection.orgId, org2.id),
        });

        expect(org1Connection?.phoneNumber).toBe("+5511111111111");
        expect(org2Connection?.phoneNumber).toBe("+5522222222222");
        expect(org1Connection?.id).not.toBe(org2Connection?.id);
      } finally {
        // Clean up org2
        await db
          .delete(whatsappConnection)
          .where(eq(whatsappConnection.orgId, org2.id));
        await cleanupTestOrg(org2.id);
      }
    });

    it("org A cannot access org B connection", async () => {
      const org2 = await createTestOrg(`WhatsApp Test Org 2 ${Date.now()}`);

      try {
        // Create connection for org1 only
        await db.insert(whatsappConnection).values({
          orgId: testOrgId,
          status: "active",
          phoneNumber: "+5511111111111",
        });

        // Query as org2 should NOT find org1's connection
        const result = await db.query.whatsappConnection.findFirst({
          where: eq(whatsappConnection.orgId, org2.id),
        });

        // findFirst returns undefined when no record found
        expect(result).toBeUndefined();
      } finally {
        await cleanupTestOrg(org2.id);
      }
    });
  });

  describe("Error Handling", () => {
    it("handles connection failure gracefully", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );

      kapsoClient.mockSetupLinkFailed(setupLink.id, "user_cancelled");

      const status = kapsoClient.getConnectionStatus(setupLink.id);

      expect(status?.status).toBe("failed");
      expect(status?.errorCode).toBe("user_cancelled");
    });

    it("returns undefined for unknown setup link ID", () => {
      const status = kapsoClient.getConnectionStatus("unknown-setup-link-xyz");

      expect(status).toBeUndefined();
    });
  });

  describe("Reset and Cleanup", () => {
    it("clearSetupLinkState removes all setup link data", async () => {
      const link1 = await kapsoClient.createSetupLink(testOrgId, defaultConfig);
      const link2 = await kapsoClient.createSetupLink(testOrgId, defaultConfig);
      kapsoClient.mockSetupLinkCompleted(link1.id, "wamid.1", "+5511111111111");

      kapsoClient.clearSetupLinkState();

      expect(kapsoClient.getSetupLinkById(link1.id)).toBeUndefined();
      expect(kapsoClient.getSetupLinkById(link2.id)).toBeUndefined();
      expect(kapsoClient.getConnectionStatus(link1.id)).toBeUndefined();
    });

    it("reset clears all state including setup links", async () => {
      const setupLink = await kapsoClient.createSetupLink(
        testOrgId,
        defaultConfig,
      );
      kapsoClient.mockSetupLinkCompleted(
        setupLink.id,
        "wamid.1",
        "+5511999999999",
      );

      kapsoClient.reset();

      expect(kapsoClient.getSetupLinkById(setupLink.id)).toBeUndefined();
      expect(kapsoClient.getConnectionStatus(setupLink.id)).toBeUndefined();
    });
  });
});
