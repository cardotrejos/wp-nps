import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, webhookJob } from "@wp-nps/db";
import {
  enqueueJob,
  acquireNextJob,
  completeJob,
  failJob,
  calculateNextRetry,
} from "@wp-nps/api/services/job-queue";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

describe("Webhook Job Queue", () => {
  let testOrg: { id: string; name: string; slug: string };

  beforeEach(async () => {
    await clearOrgContext();
    testOrg = await createTestOrg(`Test Org ${Date.now()}`);
    await db.delete(webhookJob).where(eq(webhookJob.orgId, testOrg.id));
  });

  afterEach(async () => {
    await db.delete(webhookJob).where(eq(webhookJob.orgId, testOrg.id)).catch(() => {});
    await cleanupTestOrg(testOrg.id).catch(() => {});
    await clearOrgContext();
  });

  describe("enqueueJob (AC #1)", () => {
    it("should create a pending job with correct properties", async () => {
      const jobId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: "kapso:delivery-123:response",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: { score: 9, feedback: "Great service!" },
      });

      expect(jobId).toBeDefined();

      const job = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.id, jobId!),
      });

      expect(job).toBeDefined();
      expect(job?.status).toBe("pending");
      expect(job?.attempts).toBe(0);
      expect(job?.maxAttempts).toBe(3);
      expect(job?.orgId).toBe(testOrg.id);
      expect(job?.source).toBe("kapso");
      expect(job?.eventType).toBe("kapso.message.received");
    });

    it("should ignore duplicate idempotency keys (idempotent behavior)", async () => {
      const key = "kapso:delivery-456:response";

      const firstId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: key,
        source: "kapso",
        eventType: "kapso.message.received",
        payload: { score: 9 },
      });

      const secondId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: key,
        source: "kapso",
        eventType: "kapso.message.received",
        payload: { score: 8 },
      });

      expect(firstId).toBeDefined();
      expect(secondId).toBeNull();
    });

    it("should allow custom maxAttempts", async () => {
      const jobId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: "custom-max:001",
        source: "internal",
        eventType: "internal.test",
        payload: {},
        maxAttempts: 5,
      });

      const job = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.id, jobId!),
      });

      expect(job?.maxAttempts).toBe(5);
    });
  });

  describe("acquireNextJob (AC #2, #6)", () => {
    it("should acquire pending job and mark as processing", async () => {
      await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: "acquire-test:001",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: { score: 10 },
      });

      const acquired = await acquireNextJob();

      expect(acquired).toBeDefined();
      expect(acquired?.status).toBe("processing");
      expect(acquired?.eventType).toBe("kapso.message.received");
    });

    it("should return null when no pending jobs exist", async () => {
      const acquired = await acquireNextJob();
      expect(acquired).toBeNull();
    });

    it("should not acquire jobs scheduled for future", async () => {
      const futureTime = new Date(Date.now() + 60_000);

      await db.insert(webhookJob).values({
        orgId: testOrg.id,
        idempotencyKey: "future-job:001",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
        status: "pending",
        nextRetryAt: futureTime,
      });

      const acquired = await acquireNextJob();
      expect(acquired).toBeNull();
    });

    it("should acquire jobs in order of nextRetryAt", async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 10_000);
      const later = new Date(now.getTime() - 5_000);

      await db.insert(webhookJob).values({
        orgId: testOrg.id,
        idempotencyKey: "order-test:later",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
        status: "pending",
        nextRetryAt: later,
      });

      await db.insert(webhookJob).values({
        orgId: testOrg.id,
        idempotencyKey: "order-test:earlier",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
        status: "pending",
        nextRetryAt: earlier,
      });

      const acquired = await acquireNextJob();
      expect(acquired?.idempotencyKey).toBe("order-test:earlier");
    });
  });

  describe("completeJob (AC #2)", () => {
    it("should mark job as completed with processedAt timestamp", async () => {
      const jobId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: "complete-test:001",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
      });

      await acquireNextJob();
      await completeJob(jobId!);

      const job = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.id, jobId!),
      });

      expect(job?.status).toBe("completed");
      expect(job?.processedAt).toBeDefined();
    });
  });

  describe("failJob and retry logic (AC #3, #4)", () => {
    it("should reschedule with exponential backoff when retries remain", async () => {
      const jobId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: "retry-test:001",
        source: "internal",
        eventType: "internal.test",
        payload: {},
        maxAttempts: 3,
      });

      await acquireNextJob();
      const beforeFail = new Date();
      await failJob(jobId!, new Error("Connection timeout"));

      const job = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.id, jobId!),
      });

      expect(job?.status).toBe("pending");
      expect(job?.attempts).toBe(1);
      expect(job?.errorMessage).toBe("Connection timeout");
      expect(job?.nextRetryAt).toBeDefined();
      expect(job!.nextRetryAt!.getTime()).toBeGreaterThan(beforeFail.getTime());
    });

    it("should mark as failed after max attempts exhausted", async () => {
      const jobId = await enqueueJob({
        orgId: testOrg.id,
        idempotencyKey: "max-retry-test:001",
        source: "internal",
        eventType: "internal.test",
        payload: {},
        maxAttempts: 2,
      });

      await acquireNextJob();
      await failJob(jobId!, new Error("Error 1"));

      await db
        .update(webhookJob)
        .set({ status: "processing" })
        .where(eq(webhookJob.id, jobId!));
      await failJob(jobId!, new Error("Error 2"));

      const job = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.id, jobId!),
      });

      expect(job?.status).toBe("failed");
      expect(job?.attempts).toBe(2);
      expect(job?.errorMessage).toBe("Error 2");
    });
  });

  describe("calculateNextRetry", () => {
    it("should calculate exponential backoff delays", () => {
      const now = Date.now();

      const retry1 = calculateNextRetry(1);
      const retry2 = calculateNextRetry(2);
      const retry3 = calculateNextRetry(3);

      const delay1 = retry1.getTime() - now;
      const delay2 = retry2.getTime() - now;
      const delay3 = retry3.getTime() - now;

      expect(delay1).toBeGreaterThanOrEqual(25_000);
      expect(delay1).toBeLessThanOrEqual(35_000);

      expect(delay2).toBeGreaterThanOrEqual(115_000);
      expect(delay2).toBeLessThanOrEqual(125_000);

      expect(delay3).toBeLessThanOrEqual(8 * 60 * 1000 + 5_000);
    });
  });

  describe("multi-tenant isolation (AC #6)", () => {
    it("should prevent cross-org job access", async () => {
      const org1 = await createTestOrg(`Org 1 ${Date.now()}`);
      const org2 = await createTestOrg(`Org 2 ${Date.now()}`);

      await enqueueJob({
        orgId: org1.id,
        idempotencyKey: "org1:job:1",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
      });

      const org2Jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.orgId, org2.id),
      });

      expect(org2Jobs).toHaveLength(0);

      await db.delete(webhookJob).where(eq(webhookJob.orgId, org1.id));
      await cleanupTestOrg(org1.id);
      await cleanupTestOrg(org2.id);
    });

    it("should scope job queries to specific org", async () => {
      const org1 = await createTestOrg(`Scope Org 1 ${Date.now()}`);
      const org2 = await createTestOrg(`Scope Org 2 ${Date.now()}`);

      await enqueueJob({
        orgId: org1.id,
        idempotencyKey: "scope:org1:1",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
      });

      await enqueueJob({
        orgId: org2.id,
        idempotencyKey: "scope:org2:1",
        source: "kapso",
        eventType: "kapso.message.received",
        payload: {},
      });

      const org1Jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.orgId, org1.id),
      });

      const org2Jobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.orgId, org2.id),
      });

      expect(org1Jobs).toHaveLength(1);
      expect(org2Jobs).toHaveLength(1);

      await db.delete(webhookJob).where(eq(webhookJob.orgId, org1.id));
      await db.delete(webhookJob).where(eq(webhookJob.orgId, org2.id));
      await cleanupTestOrg(org1.id);
      await cleanupTestOrg(org2.id);
    });
  });
});
