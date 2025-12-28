import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { surveyTemplate } from "@wp-nps/db/schema/survey-template";
import { survey } from "@wp-nps/db/schema/flowpulse";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

/**
 * Survey Template Gallery Integration Tests (Story 2.1)
 *
 * Tests the survey list and template gallery functionality:
 * - AC #1: Template gallery with NPS, CSAT, CES options
 * - AC #2: Template cards show question count
 * - AC #3: Empty state when no surveys
 * - AC #4: Survey list with org isolation
 * - AC #5: Template selection flow
 */

describe("Survey Template Gallery", () => {
  describe("AC #1: Template Gallery Displays All Templates", () => {
    it("returns all 3 default templates", async () => {
      const templates = await db.query.surveyTemplate.findMany();

      expect(templates.length).toBeGreaterThanOrEqual(3);

      const types = templates.map((t) => t.type);
      expect(types).toContain("nps");
      expect(types).toContain("csat");
      expect(types).toContain("ces");
    });

    it("each template has type, description, and questions", async () => {
      const templates = await db.query.surveyTemplate.findMany();

      for (const template of templates) {
        expect(template.type).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.description.length).toBeGreaterThan(0);
        expect(template.questions).toBeDefined();
        expect(Array.isArray(template.questions)).toBe(true);
      }
    });
  });

  describe("AC #2: Template Cards Show Question Count", () => {
    it("NPS template shows correct question count (2)", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      expect(npsTemplate?.questions).toHaveLength(2);
    });

    it("CSAT template shows correct question count (1)", async () => {
      const csatTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "csat"),
      });

      expect(csatTemplate?.questions).toHaveLength(1);
    });

    it("CES template shows correct question count (1)", async () => {
      const cesTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "ces"),
      });

      expect(cesTemplate?.questions).toHaveLength(1);
    });
  });

  describe("AC #3: Empty State When No Surveys", () => {
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

    it("empty org has zero surveys", async () => {
      const org = await createTestOrg(`Empty Survey Org ${Date.now()}`);
      testOrgId = org.id;

      const surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, org.id),
      });

      expect(surveys).toHaveLength(0);
    });

    it("templates are still accessible when no surveys exist", async () => {
      const org = await createTestOrg(`No Surveys Org ${Date.now()}`);
      testOrgId = org.id;

      // No surveys for this org
      const surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, org.id),
      });
      expect(surveys).toHaveLength(0);

      // But templates should be accessible (they're global)
      const templates = await db.query.surveyTemplate.findMany();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe("AC #4: Survey List with Org Isolation", () => {
    let testOrgId1: string;
    let testOrgId2: string;

    afterEach(async () => {
      if (testOrgId1) {
        try {
          // Clean up surveys first
          await db.delete(survey).where(eq(survey.orgId, testOrgId1));
          await cleanupTestOrg(testOrgId1);
        } catch {
          // Ignore
        }
      }
      if (testOrgId2) {
        try {
          await db.delete(survey).where(eq(survey.orgId, testOrgId2));
          await cleanupTestOrg(testOrgId2);
        } catch {
          // Ignore
        }
      }
      await clearOrgContext();
    });

    it("returns only surveys for the specified org", async () => {
      const org1 = await createTestOrg(`Survey Org 1 ${Date.now()}`);
      const org2 = await createTestOrg(`Survey Org 2 ${Date.now() + 1}`);
      testOrgId1 = org1.id;
      testOrgId2 = org2.id;

      // Create survey for org1
      await db.insert(survey).values({
        orgId: org1.id,
        name: "Org1 NPS Survey",
        type: "nps",
        status: "draft",
        questions: [
          {
            id: "q1",
            text: "How likely are you to recommend us?",
            type: "rating",
            scale: { min: 0, max: 10 },
            required: true,
          },
        ],
      });

      // Create survey for org2
      await db.insert(survey).values({
        orgId: org2.id,
        name: "Org2 CSAT Survey",
        type: "csat",
        status: "draft",
        questions: [
          {
            id: "q1",
            text: "How satisfied are you?",
            type: "rating",
            scale: { min: 1, max: 5 },
            required: true,
          },
        ],
      });

      // Query org1 surveys
      const org1Surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, org1.id),
      });

      expect(org1Surveys).toHaveLength(1);
      expect(org1Surveys[0]?.name).toBe("Org1 NPS Survey");
      expect(org1Surveys[0]?.type).toBe("nps");

      // Query org2 surveys
      const org2Surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, org2.id),
      });

      expect(org2Surveys).toHaveLength(1);
      expect(org2Surveys[0]?.name).toBe("Org2 CSAT Survey");
      expect(org2Surveys[0]?.type).toBe("csat");
    });

    it("returns empty array when org has no surveys", async () => {
      const org = await createTestOrg(`No Surveys Org ${Date.now()}`);
      testOrgId1 = org.id;

      const surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, org.id),
      });

      expect(surveys).toHaveLength(0);
    });

    it("survey list is ordered by created_at DESC", async () => {
      const org = await createTestOrg(`Ordered Surveys Org ${Date.now()}`);
      testOrgId1 = org.id;

      // Create surveys with slight delay
      await db.insert(survey).values({
        orgId: org.id,
        name: "First Survey",
        type: "nps",
        status: "draft",
        questions: [],
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await db.insert(survey).values({
        orgId: org.id,
        name: "Second Survey",
        type: "csat",
        status: "draft",
        questions: [],
      });

      const surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, org.id),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      });

      expect(surveys).toHaveLength(2);
      expect(surveys[0]?.name).toBe("Second Survey"); // Newest first
      expect(surveys[1]?.name).toBe("First Survey");
    });
  });

  describe("AC #5: Template Selection Prepares for Survey Creation", () => {
    it("templates have valid IDs for selection", async () => {
      const templates = await db.query.surveyTemplate.findMany();

      for (const template of templates) {
        expect(template.id).toBeDefined();
        expect(typeof template.id).toBe("string");
        expect(template.id.length).toBeGreaterThan(0);
      }
    });

    it("selected template can be retrieved by ID", async () => {
      const templates = await db.query.surveyTemplate.findMany();
      const selectedId = templates[0]?.id;

      expect(selectedId).toBeDefined();

      const retrieved = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.id, selectedId!),
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(selectedId);
    });

    it("template has all required fields for survey creation", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      // These fields are needed to create a survey from a template
      expect(npsTemplate).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: "nps",
        questions: expect.any(Array),
      });

      // Questions should have all required fields
      const question = npsTemplate?.questions[0];
      expect(question).toMatchObject({
        id: expect.any(String),
        text: expect.any(String),
        type: expect.stringMatching(/^(rating|text)$/),
        required: expect.any(Boolean),
      });
    });
  });

  describe("Survey Schema Validation", () => {
    let testOrgId: string;

    afterEach(async () => {
      if (testOrgId) {
        try {
          await db.delete(survey).where(eq(survey.orgId, testOrgId));
          await cleanupTestOrg(testOrgId);
        } catch {
          // Ignore
        }
      }
      await clearOrgContext();
    });

    it("survey can be created with valid data", async () => {
      const org = await createTestOrg(`Survey Creation Org ${Date.now()}`);
      testOrgId = org.id;

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Test NPS Survey",
          type: "nps",
          status: "draft",
          templateId: "nps-default",
          questions: [
            {
              id: "q1",
              text: "How likely are you to recommend us?",
              type: "rating",
              scale: { min: 0, max: 10 },
              required: true,
            },
            {
              id: "q2",
              text: "What could we improve?",
              type: "text",
              required: false,
            },
          ],
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Test NPS Survey");
      expect(result[0]?.type).toBe("nps");
      expect(result[0]?.status).toBe("draft");
      expect(result[0]?.questions).toHaveLength(2);
    });

    it("survey has correct default status", async () => {
      const org = await createTestOrg(`Default Status Org ${Date.now()}`);
      testOrgId = org.id;

      const result = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Default Status Survey",
          type: "csat",
          questions: [],
        })
        .returning();

      expect(result[0]?.status).toBe("draft");
    });
  });
});
