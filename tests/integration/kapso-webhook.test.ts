import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, webhookJob, whatsappConnection } from "@wp-nps/db";
import { KapsoMockClient } from "@wp-nps/kapso";
import {
  parseKapsoWebhook,
  parseSurveyResponse,
  isValidWebhookPayload,
} from "@wp-nps/kapso";
import { redactPII } from "@wp-nps/api/utils/secure-logger";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

describe("Kapso Webhook Receiver", () => {
  let testOrg: { id: string; name: string; slug: string };
  let kapsoMock: KapsoMockClient;

  beforeEach(async () => {
    await clearOrgContext();
    testOrg = await createTestOrg(`Webhook Test Org ${Date.now()}`);
    kapsoMock = new KapsoMockClient();
    kapsoMock.reset();

    await db.insert(whatsappConnection).values({
      orgId: testOrg.id,
      status: "active",
      phoneNumber: "+5511999999999",
      metadata: { phoneNumberId: "test-phone-id-123" },
    });
  });

  afterEach(async () => {
    await db.delete(webhookJob).where(eq(webhookJob.orgId, testOrg.id)).catch(() => {});
    await db.delete(whatsappConnection).where(eq(whatsappConnection.orgId, testOrg.id)).catch(() => {});
    await cleanupTestOrg(testOrg.id).catch(() => {});
    await clearOrgContext();
  });

  describe("Webhook Signature Verification (AC #3)", () => {
    it("should accept valid signature", () => {
      kapsoMock.mockValidSignature("valid-sig-123");
      const isValid = kapsoMock.verifyWebhook("valid-sig-123", '{"test": "data"}');
      expect(isValid).toBe(true);
    });

    it("should reject invalid signature", () => {
      kapsoMock.mockInvalidSignature("bad-sig");
      const isValid = kapsoMock.verifyWebhook("bad-sig", '{"test": "data"}');
      expect(isValid).toBe(false);
    });

    it("should use default verification when no specific mock set", () => {
      kapsoMock.setDefaultWebhookVerification(true);
      expect(kapsoMock.verifyWebhook("any-sig", "any-payload")).toBe(true);

      kapsoMock.setDefaultWebhookVerification(false);
      expect(kapsoMock.verifyWebhook("any-sig", "any-payload")).toBe(false);
    });
  });

  describe("Webhook Payload Parsing (AC #2)", () => {
    const validSinglePayload = {
      phone_number_id: "test-phone-id-123",
      message: {
        id: "msg-123",
        from: "+5511999999999",
        type: "text" as const,
        text: { body: "9" },
        kapso: { direction: "inbound" as const, origin: "user" },
      },
      conversation: {
        id: "conv-1",
        phone_number: "+5511999999999",
        phone_number_id: "test-phone-id-123",
      },
    };

    const validBatchedPayload = {
      type: "whatsapp.message.received",
      batch: true as const,
      data: [validSinglePayload],
    };

    it("should parse valid webhook payload", () => {
      const parsed = parseKapsoWebhook(validSinglePayload);

      expect(parsed[0]?.phoneNumberId).toBe("test-phone-id-123");
      expect(parsed[0]?.customerPhone).toBe("+5511999999999");
      expect(parsed[0]?.messageId).toBe("msg-123");
      expect(parsed[0]?.content).toBe("9");
      expect(parsed[0]?.direction).toBe("inbound");
      expect(parsed[0]?.timestamp).toBeDefined();
    });

    it("should throw on missing required fields", () => {
      expect(() => parseKapsoWebhook({})).toThrow("missing required fields");
      expect(() => parseKapsoWebhook({ phone_number_id: "x" })).toThrow("missing required fields");
      expect(() =>
        parseKapsoWebhook({
          phone_number_id: "x",
          message: { from: "+1" },
        }),
      ).toThrow("missing message ID");
    });

    it("should validate payload structure", () => {
      expect(isValidWebhookPayload(validBatchedPayload)).toBe(true);
      expect(isValidWebhookPayload({})).toBe(false);
      expect(isValidWebhookPayload(null)).toBe(false);
      expect(isValidWebhookPayload({ phone_number_id: "x" })).toBe(false);
    });
  });

  describe("Survey Response Parsing (AC #2)", () => {
    it("should parse NPS score (0-10)", () => {
      expect(parseSurveyResponse("9", "nps")).toEqual({ score: 9, feedback: null });
      expect(parseSurveyResponse("0", "nps")).toEqual({ score: 0, feedback: null });
      expect(parseSurveyResponse("10", "nps")).toEqual({ score: 10, feedback: null });
      expect(parseSurveyResponse("11", "nps")).toEqual({ score: null, feedback: "11" });
    });

    it("should parse CSAT score (1-5)", () => {
      expect(parseSurveyResponse("5", "csat")).toEqual({ score: 5, feedback: null });
      expect(parseSurveyResponse("1", "csat")).toEqual({ score: 1, feedback: null });
      expect(parseSurveyResponse("0", "csat")).toEqual({ score: null, feedback: "0" });
      expect(parseSurveyResponse("6", "csat")).toEqual({ score: null, feedback: "6" });
    });

    it("should parse CES score (1-7)", () => {
      expect(parseSurveyResponse("7", "ces")).toEqual({ score: 7, feedback: null });
      expect(parseSurveyResponse("1", "ces")).toEqual({ score: 1, feedback: null });
      expect(parseSurveyResponse("0", "ces")).toEqual({ score: null, feedback: "0" });
      expect(parseSurveyResponse("8", "ces")).toEqual({ score: null, feedback: "8" });
    });

    it("should extract feedback after score", () => {
      expect(parseSurveyResponse("9 Great service!", "nps")).toEqual({
        score: 9,
        feedback: "Great service!",
      });
      expect(parseSurveyResponse("8  Could be faster  ", "nps")).toEqual({
        score: 8,
        feedback: "Could be faster",
      });
    });

    it("should handle text-only responses", () => {
      expect(parseSurveyResponse("Great product", "nps")).toEqual({
        score: null,
        feedback: "Great product",
      });
    });
  });

  describe("Idempotency Handling (AC #4)", () => {
    it("should create job on first webhook", async () => {
      const idempotencyKey = `kapso:msg-unique-${Date.now()}`;

      await db.insert(webhookJob).values({
        orgId: testOrg.id,
        idempotencyKey,
        source: "kapso",
        eventType: "kapso.message.received",
        payload: { score: 9 },
      });

      const jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.idempotencyKey, idempotencyKey),
      });

      expect(jobs).toHaveLength(1);
    });

    it("should not create duplicate jobs with same idempotency key", async () => {
      const idempotencyKey = `kapso:msg-dup-${Date.now()}`;

      await db.insert(webhookJob).values({
        orgId: testOrg.id,
        idempotencyKey,
        source: "kapso",
        eventType: "kapso.message.received",
        payload: { score: 9 },
      });

      await db
        .insert(webhookJob)
        .values({
          orgId: testOrg.id,
          idempotencyKey,
          source: "kapso",
          eventType: "kapso.message.received",
          payload: { score: 8 },
        })
        .onConflictDoNothing({ target: webhookJob.idempotencyKey });

      const jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.idempotencyKey, idempotencyKey),
      });

      expect(jobs).toHaveLength(1);
      expect((jobs[0]?.payload as { score: number }).score).toBe(9);
    });
  });

  describe("PII Redaction (AC #5)", () => {
    it("should redact phone numbers", () => {
      const result = redactPII("+5511999999999") as string;
      expect(result).toBe("[REDACTED]");
    });

    it("should redact phone fields in objects", () => {
      const result = redactPII({
        customerPhone: "+5511999999999",
        message: "Hello",
      }) as Record<string, unknown>;

      expect(result.customerPhone).toBe("[REDACTED]");
      expect(result.message).toBe("Hello");
    });

    it("should redact emails", () => {
      const result = redactPII("user@example.com") as string;
      expect(result).toBe("[REDACTED]");
    });

    it("should redact nested PII", () => {
      const result = redactPII({
        data: {
          phone: "+5511999999999",
          email: "test@test.com",
          content: "Has phone +1234567890123 in text",
        },
      }) as Record<string, Record<string, unknown>>;

      expect(result.data?.phone).toBe("[REDACTED]");
      expect(result.data?.email).toBe("[REDACTED]");
      expect(result.data?.content).toBe("Has phone [REDACTED] in text");
    });

    it("should handle arrays", () => {
      const result = redactPII(["+5511999999999", "normal text"]) as string[];
      expect(result[0]).toBe("[REDACTED]");
      expect(result[1]).toBe("normal text");
    });
  });

  describe("Org Lookup by Phone Number ID", () => {
    it("should find org by phoneNumberId in metadata", async () => {
      const connection = await db.query.whatsappConnection.findFirst({
        where: sql`${whatsappConnection.metadata}->>'phoneNumberId' = 'test-phone-id-123'`,
      });

      expect(connection).toBeDefined();
      expect(connection?.orgId).toBe(testOrg.id);
    });

    it("should return undefined for unknown phoneNumberId", async () => {
      const connection = await db.query.whatsappConnection.findFirst({
        where: sql`${whatsappConnection.metadata}->>'phoneNumberId' = 'unknown-phone-id'`,
      });

      expect(connection).toBeUndefined();
    });
  });
});
