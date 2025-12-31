import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, webhookJob, onboardingEmailLog } from "@wp-nps/db";
import { getMockEmailClient, resetMockEmailClient } from "@wp-nps/api/lib/email";
import { createTestOrg, createTestUser, cleanupTestOrg, clearOrgContext } from "../utils/test-org";
import { onboardingAbandonmentCheckHandler } from "../../apps/server/_source/jobs/handlers/onboarding-abandonment-check";
import { sendOnboardingReminderHandler } from "../../apps/server/_source/jobs/handlers/send-onboarding-reminder";

describe("Onboarding Reminder Emails", () => {
  let testOrg: { id: string; name: string; slug: string };
  let testUser: { userId: string; email: string; role: string };

  beforeEach(async () => {
    await clearOrgContext();
    testOrg = await createTestOrg(`Test Org ${Date.now()}`);
    testUser = await createTestUser(testOrg.id, "test@example.com", "owner");
    await db.delete(webhookJob).where(eq(webhookJob.orgId, testOrg.id));
    await db.delete(onboardingEmailLog).where(eq(onboardingEmailLog.orgId, testOrg.id));
    resetMockEmailClient();
  });

  afterEach(async () => {
    await db
      .delete(webhookJob)
      .where(eq(webhookJob.orgId, testOrg.id))
      .catch(() => {});
    await db
      .delete(onboardingEmailLog)
      .where(eq(onboardingEmailLog.orgId, testOrg.id))
      .catch(() => {});
    await cleanupTestOrg(testOrg.id).catch(() => {});
    await clearOrgContext();
  });

  describe("Abandonment Detection (AC #1, #5)", () => {
    it("should detect users with stale lastActivityAt (>24h)", async () => {
      const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);

      await db.execute(sql`
        UPDATE organization
        SET onboarding_state = jsonb_set(
          onboarding_state,
          '{lastActivityAt}',
          to_jsonb(${staleTime.toISOString()}::text)
        )
        WHERE id = ${testOrg.id}
      `);

      await onboardingAbandonmentCheckHandler.handle({
        id: "test-job-1",
        orgId: "system",
        eventType: "internal.onboarding.abandonment_check",
        payload: {},
        attempts: 0,
      });

      const reminderJob = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.eventType, "internal.email.onboarding_reminder"),
      });

      expect(reminderJob).toBeDefined();
      expect((reminderJob?.payload as Record<string, unknown>).orgId).toBe(testOrg.id);
    });

    it("should exclude users who completed onboarding (AC #2)", async () => {
      await db.execute(sql`
        UPDATE organization
        SET onboarding_state = jsonb_set(
          jsonb_set(
            onboarding_state,
            '{lastActivityAt}',
            to_jsonb(${new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()}::text)
          ),
          '{onboardingCompletedAt}',
          to_jsonb(${new Date().toISOString()}::text)
        )
        WHERE id = ${testOrg.id}
      `);

      await onboardingAbandonmentCheckHandler.handle({
        id: "test-job-2",
        orgId: "system",
        eventType: "internal.onboarding.abandonment_check",
        payload: {},
        attempts: 0,
      });

      const reminderJobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.eventType, "internal.email.onboarding_reminder"),
      });

      const jobForOrg = reminderJobs.find(
        (j) => (j.payload as Record<string, unknown>).orgId === testOrg.id,
      );
      expect(jobForOrg).toBeUndefined();
    });

    it("should not detect users with recent activity (<24h)", async () => {
      const recentTime = new Date(Date.now() - 1 * 60 * 60 * 1000);

      await db.execute(sql`
        UPDATE organization
        SET onboarding_state = jsonb_set(
          onboarding_state,
          '{lastActivityAt}',
          to_jsonb(${recentTime.toISOString()}::text)
        )
        WHERE id = ${testOrg.id}
      `);

      await onboardingAbandonmentCheckHandler.handle({
        id: "test-job-3",
        orgId: "system",
        eventType: "internal.onboarding.abandonment_check",
        payload: {},
        attempts: 0,
      });

      const reminderJobs = await db.query.webhookJob.findMany({
        where: eq(webhookJob.eventType, "internal.email.onboarding_reminder"),
      });

      const jobForOrg = reminderJobs.find(
        (j) => (j.payload as Record<string, unknown>).orgId === testOrg.id,
      );
      expect(jobForOrg).toBeUndefined();
    });
  });

  describe("Email Sending (AC #1)", () => {
    it("should send reminder email to abandoned user", async () => {
      const mockClient = getMockEmailClient();

      await sendOnboardingReminderHandler.handle({
        id: "test-job-4",
        orgId: testOrg.id,
        eventType: "internal.email.onboarding_reminder",
        payload: {
          orgId: testOrg.id,
          userId: testUser.userId,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        attempts: 0,
      });

      expect(mockClient.sentEmails).toHaveLength(1);
      expect(mockClient.sentEmails[0]?.to).toBe(testUser.email);
      expect(mockClient.sentEmails[0]?.subject).toContain("FlowPulse");
    });

    it("should log email to onboarding_email_log after sending", async () => {
      await sendOnboardingReminderHandler.handle({
        id: "test-job-5",
        orgId: testOrg.id,
        eventType: "internal.email.onboarding_reminder",
        payload: {
          orgId: testOrg.id,
          userId: testUser.userId,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        attempts: 0,
      });

      const logEntry = await db.query.onboardingEmailLog.findFirst({
        where: eq(onboardingEmailLog.orgId, testOrg.id),
      });

      expect(logEntry).toBeDefined();
      expect(logEntry?.emailType).toBe("reminder_24h");
      expect(logEntry?.userId).toBe(testUser.userId);
    });
  });

  describe("Duplicate Prevention (AC #3)", () => {
    it("should skip if reminder already sent in last 24h", async () => {
      const mockClient = getMockEmailClient();

      await db.insert(onboardingEmailLog).values({
        orgId: testOrg.id,
        userId: testUser.userId,
        emailType: "reminder_24h",
      });

      await sendOnboardingReminderHandler.handle({
        id: "test-job-6",
        orgId: testOrg.id,
        eventType: "internal.email.onboarding_reminder",
        payload: {
          orgId: testOrg.id,
          userId: testUser.userId,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        attempts: 0,
      });

      expect(mockClient.sentEmails).toHaveLength(0);
    });

    it("should send if last reminder was more than 24h ago", async () => {
      const mockClient = getMockEmailClient();

      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await db.execute(sql`
        INSERT INTO onboarding_email_log (id, org_id, user_id, email_type, sent_at)
        VALUES (gen_random_uuid(), ${testOrg.id}, ${testUser.userId}, 'reminder_24h', ${oldTime.toISOString()}::timestamp)
      `);

      await sendOnboardingReminderHandler.handle({
        id: "test-job-7",
        orgId: testOrg.id,
        eventType: "internal.email.onboarding_reminder",
        payload: {
          orgId: testOrg.id,
          userId: testUser.userId,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        attempts: 0,
      });

      expect(mockClient.sentEmails).toHaveLength(1);
    });
  });

  describe("Activity Update (AC #4)", () => {
    it("should skip sending if onboarding was completed since job queued", async () => {
      const mockClient = getMockEmailClient();

      await db.execute(sql`
        UPDATE organization
        SET onboarding_state = jsonb_set(
          onboarding_state,
          '{onboardingCompletedAt}',
          to_jsonb(${new Date().toISOString()}::text)
        )
        WHERE id = ${testOrg.id}
      `);

      await sendOnboardingReminderHandler.handle({
        id: "test-job-8",
        orgId: testOrg.id,
        eventType: "internal.email.onboarding_reminder",
        payload: {
          orgId: testOrg.id,
          userId: testUser.userId,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        attempts: 0,
      });

      expect(mockClient.sentEmails).toHaveLength(0);
    });
  });
});
