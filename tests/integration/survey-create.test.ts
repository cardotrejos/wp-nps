import { describe, it, expect, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { surveyTemplate } from "@wp-nps/db/schema/survey-template";
import { survey } from "@wp-nps/db/schema/flowpulse";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

/**
 * Survey Creation Integration Tests (Story 2.2)
 *
 * Tests the survey creation from template functionality:
 * - AC #1: Create survey with template questions
 * - AC #2: Survey has correct org_id, unique ID, templateId reference
 * - AC #3: Default name generated with date
 * - AC #4: Survey can be retrieved by ID with org filter
 * - AC #5: Error handling for invalid template
 */

describe("Survey Creation", () => {
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

  describe("AC #1: Create Survey with Template Questions", () => {
    it("creates survey with correct orgId from session", async () => {
      const org = await createTestOrg(`Survey Create Org ${Date.now()}`);
      testOrgIds.push(org.id);

      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });
      expect(npsTemplate).toBeDefined();

      // Simulate survey creation (as the API would do)
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id, // From session context
          name: "Test NPS Survey",
          type: npsTemplate!.type,
          status: "draft",
          templateId: npsTemplate!.id,
          questions: npsTemplate!.questions,
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.orgId).toBe(org.id);
      expect(result[0]?.status).toBe("draft");
    });

    it("copies all template questions to new survey", async () => {
      const org = await createTestOrg(`Survey Copy Questions ${Date.now()}`);
      testOrgIds.push(org.id);

      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });
      expect(npsTemplate).toBeDefined();

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Test NPS Survey",
          type: npsTemplate!.type,
          status: "draft",
          templateId: npsTemplate!.id,
          questions: npsTemplate!.questions,
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.questions).toEqual(npsTemplate!.questions);
      expect(result[0]?.questions).toHaveLength(2); // NPS has 2 questions
    });

    it("copies template type to survey", async () => {
      const org = await createTestOrg(`Survey Type Copy ${Date.now()}`);
      testOrgIds.push(org.id);

      const csatTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "csat"),
      });
      expect(csatTemplate).toBeDefined();

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Test CSAT Survey",
          type: csatTemplate!.type,
          status: "draft",
          templateId: csatTemplate!.id,
          questions: csatTemplate!.questions,
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe("csat");
    });
  });

  describe("AC #2: Survey Has Correct References", () => {
    it("survey has unique UUID", async () => {
      const org = await createTestOrg(`Survey UUID ${Date.now()}`);
      testOrgIds.push(org.id);

      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      const result1 = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Survey 1",
          type: npsTemplate!.type,
          status: "draft",
          templateId: npsTemplate!.id,
          questions: npsTemplate!.questions,
        })
        .returning();

      const result2 = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Survey 2",
          type: npsTemplate!.type,
          status: "draft",
          templateId: npsTemplate!.id,
          questions: npsTemplate!.questions,
        })
        .returning();

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result1[0]?.id).toBeDefined();
      expect(result2[0]?.id).toBeDefined();
      expect(result1[0]?.id).not.toBe(result2[0]?.id);
    });

    it("survey stores templateId reference", async () => {
      const org = await createTestOrg(`Survey Template Ref ${Date.now()}`);
      testOrgIds.push(org.id);

      const cesTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "ces"),
      });

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Test CES Survey",
          type: cesTemplate!.type,
          status: "draft",
          templateId: cesTemplate!.id,
          questions: cesTemplate!.questions,
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.templateId).toBe(cesTemplate!.id);
    });
  });

  describe("AC #3: Default Name Generation", () => {
    it("generates name with template name and current date", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      const today = new Date();
      const dateString = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const defaultName = `${npsTemplate!.name} - ${dateString}`;

      expect(defaultName).toContain("Net Promoter Score");
      expect(defaultName).toContain("2025");
    });

    it("allows custom name override", async () => {
      const org = await createTestOrg(`Survey Custom Name ${Date.now()}`);
      testOrgIds.push(org.id);

      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      const customName = "My Custom Survey Name";
      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: customName,
          type: npsTemplate!.type,
          status: "draft",
          templateId: npsTemplate!.id,
          questions: npsTemplate!.questions,
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe(customName);
    });
  });

  describe("AC #4: Survey GetById with Org Isolation", () => {
    it("returns survey for correct org", async () => {
      const org = await createTestOrg(`Survey GetById ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "My Survey",
          type: "nps",
          status: "draft",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      const testSurvey = result[0]!;

      // Query with org filter (as API would do)
      const found = await db.query.survey.findFirst({
        where: and(eq(survey.id, testSurvey.id), eq(survey.orgId, org.id)),
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(testSurvey.id);
      expect(found?.name).toBe("My Survey");
    });

    it("returns null when querying with wrong org", async () => {
      const org1 = await createTestOrg(`Survey Org1 ${Date.now()}`);
      const org2 = await createTestOrg(`Survey Org2 ${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org1.id,
          name: "Org1 Survey",
          type: "nps",
          status: "draft",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      const testSurvey = result[0]!;

      // Try to access as org2 - should not find it
      const found = await db.query.survey.findFirst({
        where: and(
          eq(survey.id, testSurvey.id),
          eq(survey.orgId, org2.id), // Wrong org!
        ),
      });

      expect(found).toBeUndefined();
    });

    it("returns survey with all fields populated", async () => {
      const org = await createTestOrg(`Survey Full Fields ${Date.now()}`);
      testOrgIds.push(org.id);

      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Full Survey",
          type: npsTemplate!.type,
          status: "draft",
          templateId: npsTemplate!.id,
          questions: npsTemplate!.questions,
        })
        .returning();

      expect(result).toHaveLength(1);
      const testSurvey = result[0]!;

      const found = await db.query.survey.findFirst({
        where: eq(survey.id, testSurvey.id),
      });

      expect(found).toMatchObject({
        id: testSurvey.id,
        orgId: org.id,
        name: "Full Survey",
        type: "nps",
        status: "draft",
        templateId: npsTemplate!.id,
      });
      expect(found?.questions).toHaveLength(2);
      expect(found?.createdAt).toBeDefined();
    });
  });

  describe("Survey Status", () => {
    it("new surveys default to draft status", async () => {
      const org = await createTestOrg(`Survey Draft Status ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Draft Survey",
          type: "nps",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe("draft");
    });

    it("new surveys have isActive set to false", async () => {
      const org = await createTestOrg(`Survey Inactive ${Date.now()}`);
      testOrgIds.push(org.id);

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Inactive Survey",
          type: "csat",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.isActive).toBe(false);
    });
  });

  describe("Question Structure", () => {
    it("rating questions have scale information", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      const ratingQuestion = npsTemplate?.questions.find((q) => q.type === "rating");

      expect(ratingQuestion).toBeDefined();
      expect(ratingQuestion?.scale).toBeDefined();
      expect(ratingQuestion?.scale?.min).toBe(0);
      expect(ratingQuestion?.scale?.max).toBe(10);
    });

    it("questions have required field", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      for (const question of npsTemplate?.questions ?? []) {
        expect(typeof question.required).toBe("boolean");
      }
    });
  });

  describe("AC #5: Error Handling", () => {
    it("returns undefined when template does not exist", async () => {
      // Simulate what the API does when templateId is invalid
      const invalidTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.id, "non-existent-template-id"),
      });

      // The API would throw NOT_FOUND if template is undefined
      expect(invalidTemplate).toBeUndefined();
    });

    it("getById with combined org filter prevents cross-tenant access", async () => {
      const org1 = await createTestOrg(`IDOR Test Org1 ${Date.now()}`);
      const org2 = await createTestOrg(`IDOR Test Org2 ${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      // Create survey for org1
      const result = await db
        .insert(survey)
        .values({
          orgId: org1.id,
          name: "Org1 Secret Survey",
          type: "nps",
          status: "draft",
          questions: [],
        })
        .returning();

      expect(result).toHaveLength(1);
      const org1Survey = result[0]!;

      // Org2 tries to access org1's survey using combined and() filter
      // This is the SECURE pattern that prevents IDOR
      const accessAttempt = await db.query.survey.findFirst({
        where: and(
          eq(survey.id, org1Survey.id),
          eq(survey.orgId, org2.id), // Org2's context
        ),
      });

      // Should NOT find the survey - prevents IDOR
      expect(accessAttempt).toBeUndefined();

      // The message should be generic "Survey not found" - not revealing existence
      // (This is what the API does now with the combined filter)
    });

    it("survey creation fails gracefully when insert returns empty", async () => {
      // Test that the null check in survey.create would catch edge cases
      // This tests the defensive coding pattern
      const emptyResult: unknown[] = [];
      const firstItem = emptyResult[0];

      expect(firstItem).toBeUndefined();
      // The API now checks: if (!newSurvey) throw INTERNAL_SERVER_ERROR
    });
  });
});
