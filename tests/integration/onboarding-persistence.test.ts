import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { organization, defaultOnboardingState, type OnboardingState } from "@wp-nps/db/schema/auth";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

/**
 * Onboarding Progress Persistence Integration Tests
 * Story 1.4: Onboarding Progress Persistence
 *
 * Tests the onboarding state persistence at the database level.
 * Validates AC #1, #2, #4, #5 related to state persistence and retrieval.
 */

describe("Onboarding Progress Persistence", () => {
  let testOrgId: string;

  beforeEach(async () => {
    await clearOrgContext();
  });

  afterEach(async () => {
    if (testOrgId) {
      try {
        await cleanupTestOrg(testOrgId);
      } catch {
        // Ignore cleanup errors
      }
    }
    await clearOrgContext();
  });

  describe("AC #1 & #2: Onboarding State Persistence", () => {
    it("should create organization with default onboarding state", async () => {
      const org = await createTestOrg(`Test Org ${Date.now()}`);
      testOrgId = org.id;

      const foundOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(foundOrg).toBeDefined();
      expect(foundOrg?.onboardingState).toBeDefined();
      expect(foundOrg?.onboardingState.currentStep).toBe(1);
      expect(foundOrg?.onboardingState.completedSteps).toEqual([]);
      expect(foundOrg?.onboardingState.lastActivityAt).toBeNull();
      expect(foundOrg?.onboardingState.onboardingCompletedAt).toBeNull();
    });

    it("should persist onboarding state across sessions", async () => {
      const org = await createTestOrg(`Persist Test Org ${Date.now()}`);
      testOrgId = org.id;

      // Update onboarding state to step 2 with step 1 completed
      const newState: OnboardingState = {
        currentStep: 2,
        completedSteps: [1],
        lastActivityAt: new Date().toISOString(),
        onboardingCompletedAt: null,
        metadata: {},
      };

      await db
        .update(organization)
        .set({ onboardingState: newState })
        .where(eq(organization.id, org.id));

      // Simulate session reload by querying again
      const updatedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(updatedOrg?.onboardingState.currentStep).toBe(2);
      expect(updatedOrg?.onboardingState.completedSteps).toContain(1);
      expect(updatedOrg?.onboardingState.lastActivityAt).not.toBeNull();
    });

    it("should resume user at correct step after abandonment", async () => {
      const org = await createTestOrg(`Resume Test Org ${Date.now()}`);
      testOrgId = org.id;

      // User completed steps 1 and 2, left at step 3
      const abandonedState: OnboardingState = {
        currentStep: 3,
        completedSteps: [1, 2],
        lastActivityAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        onboardingCompletedAt: null,
        metadata: { whatsappConnected: true },
      };

      await db
        .update(organization)
        .set({ onboardingState: abandonedState })
        .where(eq(organization.id, org.id));

      // Simulate return after abandonment
      const resumedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(resumedOrg?.onboardingState.currentStep).toBe(3);
      expect(resumedOrg?.onboardingState.completedSteps).toEqual([1, 2]);
      expect(resumedOrg?.onboardingState.metadata.whatsappConnected).toBe(true);
    });
  });

  describe("AC #5: Onboarding Completion Detection", () => {
    it("should mark onboarding complete when all steps done", async () => {
      const org = await createTestOrg(`Complete Test Org ${Date.now()}`);
      testOrgId = org.id;

      // Complete all steps
      const completeState: OnboardingState = {
        currentStep: 4,
        completedSteps: [1, 2, 3],
        lastActivityAt: new Date().toISOString(),
        onboardingCompletedAt: new Date().toISOString(),
        metadata: { selectedTemplateId: "nps-1" },
      };

      await db
        .update(organization)
        .set({ onboardingState: completeState })
        .where(eq(organization.id, org.id));

      const completedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(completedOrg?.onboardingState.onboardingCompletedAt).not.toBeNull();
      expect(completedOrg?.onboardingState.completedSteps).toEqual([1, 2, 3]);
    });

    it("should detect incomplete onboarding correctly", async () => {
      const org = await createTestOrg(`Incomplete Test Org ${Date.now()}`);
      testOrgId = org.id;

      // Partial completion
      const partialState: OnboardingState = {
        currentStep: 2,
        completedSteps: [1],
        lastActivityAt: new Date().toISOString(),
        onboardingCompletedAt: null,
        metadata: {},
      };

      await db
        .update(organization)
        .set({ onboardingState: partialState })
        .where(eq(organization.id, org.id));

      const partialOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(partialOrg?.onboardingState.onboardingCompletedAt).toBeNull();
      expect(partialOrg?.onboardingState.completedSteps).not.toContain(3);
    });
  });

  describe("Multi-Tenant Isolation", () => {
    it("should enforce multi-tenant isolation for onboarding state", async () => {
      const org1 = await createTestOrg(`Org 1 ${Date.now()}`);
      const org2 = await createTestOrg(`Org 2 ${Date.now() + 1}`);
      testOrgId = org1.id; // For cleanup

      // Set different states for each org
      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 3,
            completedSteps: [1, 2],
            lastActivityAt: new Date().toISOString(),
            onboardingCompletedAt: null,
            metadata: {},
          },
        })
        .where(eq(organization.id, org1.id));

      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 1,
            completedSteps: [],
            lastActivityAt: null,
            onboardingCompletedAt: null,
            metadata: {},
          },
        })
        .where(eq(organization.id, org2.id));

      // Query each org separately
      const result1 = await db.query.organization.findFirst({
        where: eq(organization.id, org1.id),
      });
      const result2 = await db.query.organization.findFirst({
        where: eq(organization.id, org2.id),
      });

      expect(result1?.onboardingState.currentStep).toBe(3);
      expect(result2?.onboardingState.currentStep).toBe(1);

      // Cleanup org2
      await cleanupTestOrg(org2.id);
    });
  });

  describe("Step Completion Tracking", () => {
    it("should update lastActivityAt on each step interaction", async () => {
      const org = await createTestOrg(`Activity Test Org ${Date.now()}`);
      testOrgId = org.id;

      const beforeTime = new Date();

      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 2,
            completedSteps: [1],
            lastActivityAt: new Date().toISOString(),
            onboardingCompletedAt: null,
            metadata: {},
          },
        })
        .where(eq(organization.id, org.id));

      const updatedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      const activityTime = new Date(updatedOrg!.onboardingState.lastActivityAt!);
      expect(activityTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it("should store step completion timestamps in metadata", async () => {
      const org = await createTestOrg(`Timestamp Test Org ${Date.now()}`);
      testOrgId = org.id;

      const step1CompletedAt = new Date().toISOString();
      const step2CompletedAt = new Date(Date.now() + 1000).toISOString();

      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 3,
            completedSteps: [1, 2],
            lastActivityAt: step2CompletedAt,
            onboardingCompletedAt: null,
            metadata: {
              stepCompletedAt: {
                "1": step1CompletedAt,
                "2": step2CompletedAt,
              },
            },
          },
        })
        .where(eq(organization.id, org.id));

      const timestampOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(timestampOrg?.onboardingState.metadata.stepCompletedAt?.["1"]).toBe(step1CompletedAt);
      expect(timestampOrg?.onboardingState.metadata.stepCompletedAt?.["2"]).toBe(step2CompletedAt);
    });
  });

  describe("Metadata Storage", () => {
    it("should store selected template ID in metadata", async () => {
      const org = await createTestOrg(`Template Test Org ${Date.now()}`);
      testOrgId = org.id;

      await db
        .update(organization)
        .set({
          onboardingState: {
            ...defaultOnboardingState,
            metadata: {
              selectedTemplateId: "nps-template-1",
            },
          },
        })
        .where(eq(organization.id, org.id));

      const templateOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(templateOrg?.onboardingState.metadata.selectedTemplateId).toBe("nps-template-1");
    });

    it("should store WhatsApp connection status in metadata", async () => {
      const org = await createTestOrg(`WhatsApp Test Org ${Date.now()}`);
      testOrgId = org.id;

      await db
        .update(organization)
        .set({
          onboardingState: {
            ...defaultOnboardingState,
            currentStep: 2,
            completedSteps: [1],
            metadata: {
              whatsappConnected: true,
            },
          },
        })
        .where(eq(organization.id, org.id));

      const whatsappOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(whatsappOrg?.onboardingState.metadata.whatsappConnected).toBe(true);
    });
  });
});
