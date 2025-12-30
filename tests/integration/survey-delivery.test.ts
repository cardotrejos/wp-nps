import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, webhookJob, survey, surveyDelivery, whatsappConnection } from "@wp-nps/db";
import { KapsoMockClient } from "@wp-nps/kapso";
import { setKapsoClient, resetKapsoClient } from "../../packages/api/src/lib/kapso";
import { enqueueJob, acquireNextJob, completeJob, failJob } from "../../packages/api/src/services/job-queue";
import { surveySendHandler } from "../../apps/server/_source/jobs/handlers/survey-send";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";
import { formatSurveyMessage } from "../../packages/api/src/services/survey-message";

describe("Survey Delivery via Kapso (Story 3.4)", () => {
  let testOrg: { id: string; name: string; slug: string };
  let testSurvey: { id: string };
  let kapsoMock: KapsoMockClient;

  beforeEach(async () => {
    await clearOrgContext();
    kapsoMock = new KapsoMockClient();
    setKapsoClient(kapsoMock);

    testOrg = await createTestOrg(`Delivery Test ${Date.now()}`);

    await db.insert(whatsappConnection).values({
      orgId: testOrg.id,
      status: "active",
      phoneNumber: "+5511999999999",
    });

    const [s] = await db
      .insert(survey)
      .values({
        orgId: testOrg.id,
        name: "Test NPS Survey",
        type: "nps",
        status: "active",
        questions: [{ id: "q1", text: "How likely are you to recommend us?", type: "rating", required: true }],
      })
      .returning();

    testSurvey = s!;
  });

  afterEach(async () => {
    resetKapsoClient();
    await db.delete(webhookJob).where(eq(webhookJob.orgId, testOrg.id)).catch(() => {});
    await cleanupTestOrg(testOrg.id).catch(() => {});
    await clearOrgContext();
  });

  describe("AC #1: Survey delivered as WhatsApp message", () => {
    it("updates delivery status to 'sent' on successful Kapso call", async () => {
      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511888888888",
          phoneNumberHash: "hash123",
          status: "queued",
        })
        .returning();

      await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: `survey-send:${delivery!.id}`,
        source: "internal",
        eventType: "internal.survey.send",
        payload: {
          deliveryId: delivery!.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511888888888",
        },
      });

      const job = await acquireNextJob();
      expect(job).toBeDefined();

      await surveySendHandler.handle(job!);
      await completeJob(job!.id);

      const updatedDelivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, delivery!.id),
      });

      expect(updatedDelivery?.status).toBe("sent");
    });
  });

  describe("AC #2: Failed delivery retries up to 2 times", () => {
    it("updates delivery status to 'failed' on retryable Kapso error", async () => {
      kapsoMock.mockFailureSequence([1]);

      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511777777777",
          phoneNumberHash: "hash456",
          status: "queued",
        })
        .returning();

      await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: `survey-send:retry-${delivery!.id}`,
        source: "internal",
        eventType: "internal.survey.send",
        payload: {
          deliveryId: delivery!.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511777777777",
        },
      });

      const job = await acquireNextJob();

      try {
        await surveySendHandler.handle(job!);
      } catch {
        await failJob(job!.id, new Error("Transient failure"));
      }

      const updatedDelivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, delivery!.id),
      });

      expect(updatedDelivery?.status).toBe("failed");
      expect(updatedDelivery?.errorMessage).toContain("Transient failure");

      const updatedJob = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.id, job!.id),
      });
      expect(updatedJob?.status).toBe("pending");
      expect(updatedJob?.attempts).toBe(1);
    });
  });

  describe("AC #3: Max retries results in 'undeliverable'", () => {
    it("marks delivery as 'undeliverable' after max retries exhausted", async () => {
      kapsoMock.mockPermanentFailure("invalid_phone", "Phone number not registered on WhatsApp");

      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511666666666",
          phoneNumberHash: "hash789",
          status: "queued",
        })
        .returning();

      await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: `survey-send:undeliverable-${delivery!.id}`,
        source: "internal",
        eventType: "internal.survey.send",
        payload: {
          deliveryId: delivery!.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511666666666",
        },
      });

      const job = await acquireNextJob();
      await surveySendHandler.handle(job!);
      await completeJob(job!.id);

      const updatedDelivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, delivery!.id),
      });

      expect(updatedDelivery?.status).toBe("undeliverable");
      expect(updatedDelivery?.errorMessage).toContain("Phone number not registered");
    });
  });

  describe("AC #4: WhatsApp Flows fallback handled internally by KapsoClient", () => {
    it("processor is unaware of fallback - receives normal success response", async () => {
      // AC #4: The KapsoClient internally handles WhatsApp Flows fallback
      // The processor should be unaware - it just sees success or failure
      // This test verifies the abstraction: processor gets normal result regardless of internal fallback

      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511333333333",
          phoneNumberHash: "hashFallback",
          status: "queued",
        })
        .returning();

      await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: `survey-send:fallback-${delivery!.id}`,
        source: "internal",
        eventType: "internal.survey.send",
        payload: {
          deliveryId: delivery!.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511333333333",
        },
      });

      const job = await acquireNextJob();
      expect(job).toBeDefined();

      // Process the job - handler should work without any fallback awareness
      await surveySendHandler.handle(job!);
      await completeJob(job!.id);

      const updatedDelivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, delivery!.id),
      });

      // Processor successfully delivered - unaware if Kapso used fallback internally
      expect(updatedDelivery?.status).toBe("sent");
      expect(updatedDelivery?.kapsoDeliveryId).toBeDefined();

      // Verify the handler made exactly one call (no fallback retry logic in processor)
      const calls = kapsoMock.getCallHistory();
      const relevantCalls = calls.filter((c) => c.params.phoneNumber === "+5511333333333");
      expect(relevantCalls.length).toBe(1);
    });
  });

  describe("AC #5: KapsoMockClient failure sequence testing", () => {
    it("mockFailureSequence allows configuring which attempts fail", async () => {
      kapsoMock.mockFailureSequence([1, 2]);

      await expect(
        kapsoMock.sendSurvey({
          orgId: testOrg.id,
          phoneNumber: "+5511555555555",
          surveyId: "test",
          message: "Test",
        }),
      ).rejects.toThrow("Transient failure on attempt 1");

      await expect(
        kapsoMock.sendSurvey({
          orgId: testOrg.id,
          phoneNumber: "+5511555555555",
          surveyId: "test",
          message: "Test",
        }),
      ).rejects.toThrow("Transient failure on attempt 2");

      const result = await kapsoMock.sendSurvey({
        orgId: testOrg.id,
        phoneNumber: "+5511555555555",
        surveyId: "test",
        message: "Test",
      });

      expect(result.status).toBe("queued");
    });
  });

  describe("AC #6: kapso_message_id is stored for tracking", () => {
    it("stores kapsoDeliveryId from successful Kapso response", async () => {
      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511444444444",
          phoneNumberHash: "hashABC",
          status: "queued",
        })
        .returning();

      await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: `survey-send:kapso-id-${delivery!.id}`,
        source: "internal",
        eventType: "internal.survey.send",
        payload: {
          deliveryId: delivery!.id,
          surveyId: testSurvey.id,
          phoneNumber: "+5511444444444",
        },
      });

      const job = await acquireNextJob();
      await surveySendHandler.handle(job!);
      await completeJob(job!.id);

      const updatedDelivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, delivery!.id),
      });

      expect(updatedDelivery?.kapsoDeliveryId).toBeDefined();
      expect(updatedDelivery?.kapsoDeliveryId).toMatch(/^mock-delivery-/);
    });
  });

  describe("Survey Message Formatter", () => {
    it("formats NPS message with greeting and rating instructions", () => {
      const message = formatSurveyMessage({
        surveyType: "nps",
        questionText: "How likely are you to recommend us?",
        customerName: "Carlos",
        orgName: "Acme Corp",
      });

      expect(message).toContain("Hi Carlos!");
      expect(message).toContain("Acme Corp");
      expect(message).toContain("How likely are you to recommend us?");
      expect(message).toContain("0 (not likely) to 10 (very likely)");
    });

    it("formats CSAT message with 1-5 scale", () => {
      const message = formatSurveyMessage({
        surveyType: "csat",
        questionText: "How satisfied are you?",
        orgName: "Test Co",
      });

      expect(message).toContain("Hi!");
      expect(message).toContain("1 (very unsatisfied) to 5 (very satisfied)");
    });

    it("formats CES message with 1-7 scale", () => {
      const message = formatSurveyMessage({
        surveyType: "ces",
        questionText: "How easy was this?",
        orgName: "Easy Co",
      });

      expect(message).toContain("1 (very difficult) to 7 (very easy)");
    });
  });
});
