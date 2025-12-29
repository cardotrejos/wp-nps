import { describe, it, expect, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@wp-nps/db";
import { survey } from "@wp-nps/db/schema/flowpulse";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

const updateTriggerTypeSchema = z.object({
  surveyId: z.string(),
  triggerType: z.enum(["api", "manual"]),
});

/**
 * Simulates the updateTriggerType procedure validation logic
 * This mirrors what packages/api/src/routers/survey.ts:updateTriggerType does
 */
async function simulateUpdateTriggerTypeProcedure(
  surveyId: string,
  orgId: string,
  triggerType: "api" | "manual"
): Promise<
  { success: true; survey: typeof survey.$inferSelect } | { success: false; error: string }
> {
  // Fetch survey with org filter (CRITICAL: multi-tenancy)
  const existingSurvey = await db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.orgId, orgId)),
  });

  if (!existingSurvey) {
    return { success: false, error: "Survey not found" };
  }

  // Update trigger type
  const result = await db
    .update(survey)
    .set({
      triggerType,
      updatedAt: new Date(),
    })
    .where(and(eq(survey.id, surveyId), eq(survey.orgId, orgId)))
    .returning();

  const updatedSurvey = result[0];
  if (!updatedSurvey) {
    return { success: false, error: "Failed to update trigger type" };
  }

  return { success: true, survey: updatedSurvey };
}

describe("Survey Trigger Type", () => {
  let testOrgIds: string[] = [];

  afterEach(async () => {
    // Cleanup all test orgs
    for (const orgId of testOrgIds) {
      try {
        await db.delete(survey).where(eq(survey.orgId, orgId));
        await cleanupTestOrg(orgId);
      } catch {
        // Ignore cleanup errors
      }
    }
    testOrgIds = [];
    await clearOrgContext();
  });

  describe("AC #2: API Trigger", () => {
    it("updates trigger type from api to manual", async () => {
      const org = await createTestOrg(`Trigger API to Manual ${Date.now()}`);
      testOrgIds.push(org.id);

      // Create survey with default 'api' trigger
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "API Trigger Survey",
          type: "nps",
          status: "draft",
          triggerType: "api",
          questions: [
            { id: "q1", text: "How likely are you to recommend us?", type: "rating", required: true },
          ],
        })
        .returning();

      expect(result).toHaveLength(1);
      const testSurvey = result[0]!;
      expect(testSurvey.triggerType).toBe("api");

      // Update to manual
      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "manual");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.survey.triggerType).toBe("manual");
      }
    });

    it("saves API trigger when explicitly set", async () => {
      const org = await createTestOrg(`API Trigger Explicit ${Date.now()}`);
      testOrgIds.push(org.id);

      // Create survey with manual trigger first
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Manual to API Survey",
          type: "nps",
          status: "draft",
          triggerType: "manual",
          questions: [],
        })
        .returning();

      const testSurvey = result[0]!;

      // Update to api
      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "api");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.survey.triggerType).toBe("api");
      }
    });
  });

  describe("AC #3: Manual Trigger", () => {
    it("updates trigger type from manual to api", async () => {
      const org = await createTestOrg(`Trigger Manual to API ${Date.now()}`);
      testOrgIds.push(org.id);

      // Create survey with 'manual' trigger
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Manual Trigger Survey",
          type: "nps",
          status: "draft",
          triggerType: "manual",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      const testSurvey = result[0]!;
      expect(testSurvey.triggerType).toBe("manual");

      // Update to api
      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "api");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.survey.triggerType).toBe("api");
      }
    });

    it("saves manual trigger correctly", async () => {
      const org = await createTestOrg(`Manual Trigger Save ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Manual Survey",
          type: "nps",
          status: "draft",
          triggerType: "api",
          questions: [],
        })
        .returning();

      const testSurvey = result[0]!;

      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "manual");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.survey.triggerType).toBe("manual");
      }

      // Verify it persisted
      const persisted = await db.query.survey.findFirst({
        where: eq(survey.id, testSurvey.id),
      });
      expect(persisted?.triggerType).toBe("manual");
    });
  });

  describe("AC #4: Default Trigger Type", () => {
    it("defaults triggerType to 'api' on survey create", async () => {
      const org = await createTestOrg(`Default Trigger ${Date.now()}`);
      testOrgIds.push(org.id);

      // Create survey without explicit triggerType
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Default Trigger Survey",
          type: "nps",
          status: "draft",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      const testSurvey = result[0]!;

      // Should default to 'api'
      expect(testSurvey.triggerType).toBe("api");
    });

    it("triggerType column has default value in schema", async () => {
      const org = await createTestOrg(`Schema Default ${Date.now()}`);
      testOrgIds.push(org.id);

      // Insert with minimal values - rely on schema defaults
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Minimal Survey",
          type: "nps",
          status: "draft",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]!.triggerType).toBe("api");
    });
  });

  describe("Multi-Tenancy: Org Isolation", () => {
    it("enforces org isolation on trigger type update - cannot update other org's survey", async () => {
      const org1 = await createTestOrg(`Org1 Trigger ${Date.now()}`);
      const org2 = await createTestOrg(`Org2 Trigger ${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      // Create survey for org1
      const result = await db
        .insert(survey)
        .values({
          orgId: org1.id,
          name: "Org1 Survey",
          type: "nps",
          status: "draft",
          triggerType: "api",
          questions: [],
        })
        .returning();

      const org1Survey = result[0]!;

      // Try to update as org2 - should fail
      const updateResult = await simulateUpdateTriggerTypeProcedure(org1Survey.id, org2.id, "manual");

      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.error).toBe("Survey not found");
      }

      // Verify original survey unchanged
      const unchanged = await db.query.survey.findFirst({
        where: eq(survey.id, org1Survey.id),
      });
      expect(unchanged?.triggerType).toBe("api");
    });

    it("lookup with wrong org returns undefined", async () => {
      const org1 = await createTestOrg(`Org1 Lookup ${Date.now()}`);
      const org2 = await createTestOrg(`Org2 Lookup ${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      // Create survey for org1
      const result = await db
        .insert(survey)
        .values({
          orgId: org1.id,
          name: "Org1 Secret Survey",
          type: "nps",
          status: "draft",
          triggerType: "manual",
          questions: [],
        })
        .returning();

      const org1Survey = result[0]!;

      // Org2 tries to find org1's survey
      const found = await db.query.survey.findFirst({
        where: and(eq(survey.id, org1Survey.id), eq(survey.orgId, org2.id)),
      });

      // Should NOT find the survey - proper IDOR prevention
      expect(found).toBeUndefined();
    });
  });

  describe("Procedure Validation Logic", () => {
    it("updateTriggerType returns error for non-existent survey", async () => {
      const org = await createTestOrg(`Procedure Not Found ${Date.now()}`);
      testOrgIds.push(org.id);

      // Call with valid UUID format but non-existent survey
      const nonExistentUuid = crypto.randomUUID();
      const updateResult = await simulateUpdateTriggerTypeProcedure(nonExistentUuid, org.id, "manual");

      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.error).toBe("Survey not found");
      }
    });

    it("updateTriggerType returns error when org doesn't own survey", async () => {
      const org1 = await createTestOrg(`Procedure Org1 ${Date.now()}`);
      const org2 = await createTestOrg(`Procedure Org2 ${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      // Create survey for org1
      const result = await db
        .insert(survey)
        .values({
          orgId: org1.id,
          name: "Org1 Procedure Survey",
          type: "nps",
          status: "draft",
          triggerType: "api",
          questions: [],
        })
        .returning();

      const org1Survey = result[0]!;

      // Try to update as org2 - should fail with NOT_FOUND
      const updateResult = await simulateUpdateTriggerTypeProcedure(org1Survey.id, org2.id, "manual");

      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.error).toBe("Survey not found");
      }
    });

    it("updateTriggerType succeeds for valid survey", async () => {
      const org = await createTestOrg(`Procedure Valid ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Valid Procedure Survey",
          type: "nps",
          status: "draft",
          triggerType: "api",
          questions: [],
        })
        .returning();

      const testSurvey = result[0]!;

      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "manual");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.survey.triggerType).toBe("manual");
      }
    });
  });

  describe("State Consistency", () => {
    it("updatedAt is set when trigger type changes", async () => {
      const org = await createTestOrg(`UpdatedAt Test ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "UpdatedAt Survey",
          type: "nps",
          status: "draft",
          triggerType: "api",
          questions: [],
        })
        .returning();

      const testSurvey = result[0]!;
      const originalUpdatedAt = testSurvey.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update trigger type
      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "manual");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        const newUpdatedAt = updateResult.survey.updatedAt;
        expect(newUpdatedAt).toBeDefined();
        if (originalUpdatedAt && newUpdatedAt) {
          expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
        }
      }
    });

    it("trigger type change does not affect other survey properties", async () => {
      const org = await createTestOrg(`Property Isolation ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Property Test Survey",
          type: "nps",
          status: "active",
          isActive: true,
          triggerType: "api",
          questions: [{ id: "q1", text: "Rate us", type: "rating", required: true }],
        })
        .returning();

      const testSurvey = result[0]!;

      // Update trigger type
      const updateResult = await simulateUpdateTriggerTypeProcedure(testSurvey.id, org.id, "manual");

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.survey.name).toBe("Property Test Survey");
        expect(updateResult.survey.type).toBe("nps");
        expect(updateResult.survey.status).toBe("active");
        expect(updateResult.survey.isActive).toBe(true);
        expect(updateResult.survey.questions).toHaveLength(1);
        expect(updateResult.survey.triggerType).toBe("manual");
      }
    });
  });

  describe("Zod Schema Validation (Task 8.4)", () => {
    it("accepts 'api' trigger type", () => {
      const result = updateTriggerTypeSchema.safeParse({
        surveyId: "test-uuid",
        triggerType: "api",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 'manual' trigger type", () => {
      const result = updateTriggerTypeSchema.safeParse({
        surveyId: "test-uuid",
        triggerType: "manual",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid trigger type 'webhook'", () => {
      const result = updateTriggerTypeSchema.safeParse({
        surveyId: "test-uuid",
        triggerType: "webhook",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Invalid");
      }
    });

    it("rejects invalid trigger type 'invalid'", () => {
      const result = updateTriggerTypeSchema.safeParse({
        surveyId: "test-uuid",
        triggerType: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty trigger type", () => {
      const result = updateTriggerTypeSchema.safeParse({
        surveyId: "test-uuid",
        triggerType: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing trigger type", () => {
      const result = updateTriggerTypeSchema.safeParse({
        surveyId: "test-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing surveyId", () => {
      const result = updateTriggerTypeSchema.safeParse({
        triggerType: "api",
      });
      expect(result.success).toBe(false);
    });
  });
});
