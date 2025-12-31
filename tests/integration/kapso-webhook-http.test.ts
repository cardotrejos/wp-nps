import { describe, expect, it, beforeEach, afterEach, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, webhookJob, whatsappConnection } from "@wp-nps/db";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";
import { kapsoWebhookRouter } from "../../apps/server/_source/webhooks/kapso";

const createTestPayload = (overrides: Record<string, unknown> = {}) => ({
  phone_number_id: "http-test-phone-id",
  message: {
    phone_number: "+5511888888888",
    content: "9 Great service!",
    whatsapp_message_id: `msg-http-${Date.now()}`,
    type: "text",
    kapso: { direction: "inbound", origin: "user" },
  },
  conversation: {
    id: "conv-http-1",
    phone_number: "+5511888888888",
    phone_number_id: "http-test-phone-id",
  },
  ...overrides,
});

describe("Kapso Webhook HTTP Endpoint", () => {
  let testOrg: { id: string; name: string; slug: string };
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(kapsoWebhookRouter);
  });

  beforeEach(async () => {
    await clearOrgContext();
    testOrg = await createTestOrg(`Webhook HTTP Test ${Date.now()}`);

    await db.insert(whatsappConnection).values({
      orgId: testOrg.id,
      status: "active",
      phoneNumber: "+5511888888888",
      metadata: { phoneNumberId: "http-test-phone-id" },
    });
  });

  afterEach(async () => {
    await db.delete(webhookJob).where(eq(webhookJob.orgId, testOrg.id)).catch(() => {});
    await db.delete(whatsappConnection).where(eq(whatsappConnection.orgId, testOrg.id)).catch(() => {});
    await cleanupTestOrg(testOrg.id).catch(() => {});
    await clearOrgContext();
  });

  describe("AC #1: Webhook Processing", () => {
    it("should accept valid webhook and return 202 Accepted", async () => {
      const payload = createTestPayload();

      const response = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify(payload),
        }),
      );

      expect(response.status).toBe(202);
      const data = await response.json();
      expect(data.status).toBe("accepted");
      expect(data.job_id).toBeDefined();
    });

    it("should queue webhook job for async processing", async () => {
      const messageId = `msg-queue-test-${Date.now()}`;
      const payload = createTestPayload({
        message: {
          phone_number: "+5511888888888",
          content: "10",
          whatsapp_message_id: messageId,
          type: "text",
          kapso: { direction: "inbound", origin: "user" },
        },
      });

      await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify(payload),
        }),
      );

      const jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.idempotencyKey, `kapso:${messageId}`),
      });

      expect(jobs).toHaveLength(1);
      expect(jobs[0]?.eventType).toBe("kapso.message.received");
      expect(jobs[0]?.status).toBe("pending");
    });
  });

  describe("AC #3: Signature Verification", () => {
    it("should reject request without signature header with 401", async () => {
      const response = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createTestPayload()),
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Missing signature");
    });
  });

  describe("AC #4: Idempotency", () => {
    it("should return 200 for duplicate webhook with same message ID", async () => {
      const messageId = `msg-dup-http-${Date.now()}`;
      const payload = createTestPayload({
        message: {
          phone_number: "+5511888888888",
          content: "8",
          whatsapp_message_id: messageId,
          type: "text",
          kapso: { direction: "inbound", origin: "user" },
        },
      });

      const firstResponse = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify(payload),
        }),
      );
      expect(firstResponse.status).toBe(202);

      const secondResponse = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify(payload),
        }),
      );

      expect(secondResponse.status).toBe(200);
      const data = await secondResponse.json();
      expect(data.status).toBe("duplicate");
    });

    it("should not create duplicate jobs", async () => {
      const messageId = `msg-no-dup-${Date.now()}`;
      const payload = createTestPayload({
        message: {
          phone_number: "+5511888888888",
          content: "7",
          whatsapp_message_id: messageId,
          type: "text",
          kapso: { direction: "inbound", origin: "user" },
        },
      });

      const request = () =>
        app.handle(
          new Request("http://localhost/webhooks/kapso", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": "valid-test-signature",
            },
            body: JSON.stringify(payload),
          }),
        );

      await request();
      await request();
      await request();

      const jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.idempotencyKey, `kapso:${messageId}`),
      });

      expect(jobs).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should return 404 for unknown phone number ID", async () => {
      const payload = createTestPayload({
        phone_number_id: "unknown-phone-id",
      });

      const response = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify(payload),
        }),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Unknown phone number");
    });

    it("should ignore outbound messages", async () => {
      const payload = createTestPayload({
        message: {
          phone_number: "+5511888888888",
          content: "Hello customer",
          whatsapp_message_id: `msg-outbound-${Date.now()}`,
          type: "text",
          kapso: { direction: "outbound", origin: "system" },
        },
      });

      const response = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify(payload),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ignored");
      expect(data.reason).toBe("Not an inbound message");
    });

    it("should return 400 for invalid payload", async () => {
      const response = await app.handle(
        new Request("http://localhost/webhooks/kapso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "valid-test-signature",
          },
          body: JSON.stringify({ invalid: "payload" }),
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid payload");
    });
  });
});
