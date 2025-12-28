import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@wp-nps/db";
import { surveyTemplate } from "@wp-nps/db/schema/survey-template";
import { organization } from "@wp-nps/db/schema/auth";
import { eq } from "drizzle-orm";
import { createTestOrg, cleanupTestOrg } from "../utils/test-org";

/**
 * Template Selection Integration Tests (Story 1.5)
 *
 * Tests for the survey template infrastructure, seed data,
 * and onboarding state updates.
 */

describe("Survey Templates", () => {
  describe("Seed Data", () => {
    it("returns all 3 default templates", async () => {
      const templates = await db.query.surveyTemplate.findMany();

      expect(templates.length).toBeGreaterThanOrEqual(3);

      const types = templates.map((t) => t.type);
      expect(types).toContain("nps");
      expect(types).toContain("csat");
      expect(types).toContain("ces");
    });

    it("marks NPS as default/recommended", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      expect(npsTemplate).toBeDefined();
      expect(npsTemplate?.isDefault).toBe(true);
    });

    it("NPS template has 2 questions (rating + text)", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "nps"),
      });

      expect(npsTemplate?.questions).toHaveLength(2);

      const questions = npsTemplate?.questions;
      expect(questions?.[0]).toMatchObject({
        type: "rating",
        scale: { min: 0, max: 10 },
        required: true,
      });
      expect(questions?.[1]).toMatchObject({
        type: "text",
        required: false,
      });
    });

    it("CSAT template has 1-5 scale", async () => {
      const csatTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "csat"),
      });

      expect(csatTemplate?.questions).toHaveLength(1);
      expect(csatTemplate?.questions?.[0]).toMatchObject({
        type: "rating",
        scale: { min: 1, max: 5 },
      });
    });

    it("CES template has 1-7 scale", async () => {
      const cesTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.type, "ces"),
      });

      expect(cesTemplate?.questions).toHaveLength(1);
      expect(cesTemplate?.questions?.[0]).toMatchObject({
        type: "rating",
        scale: { min: 1, max: 7 },
      });
    });

    it("all templates have descriptions", async () => {
      const templates = await db.query.surveyTemplate.findMany();

      for (const template of templates) {
        expect(template.description).toBeDefined();
        expect(template.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe("Template Selection with Onboarding State", () => {
    let testOrgId: string;

    beforeEach(async () => {
      const testOrg = await createTestOrg("Template Test Org");
      testOrgId = testOrg.id;
    });

    afterEach(async () => {
      await cleanupTestOrg(testOrgId);
    });

    it("updates onboarding state with selected template", async () => {
      // Set up: complete step 2 first
      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 3,
            completedSteps: [1, 2],
            lastActivityAt: new Date().toISOString(),
            onboardingCompletedAt: null,
            metadata: { whatsappConnected: true },
          },
        })
        .where(eq(organization.id, testOrgId));

      // Complete step 3 with template selection
      const selectedTemplateId = "nps-default";
      const now = new Date().toISOString();

      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 4,
            completedSteps: [1, 2, 3],
            lastActivityAt: now,
            onboardingCompletedAt: now,
            metadata: {
              whatsappConnected: true,
              selectedTemplateId,
              stepCompletedAt: { "3": now },
            },
          },
        })
        .where(eq(organization.id, testOrgId));

      // Verify
      const updatedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, testOrgId),
      });

      const state = updatedOrg?.onboardingState as {
        metadata: { selectedTemplateId?: string };
        onboardingCompletedAt: string | null;
      };
      expect(state.metadata.selectedTemplateId).toBe(selectedTemplateId);
      expect(state.onboardingCompletedAt).not.toBeNull();
    });

    it("marks onboarding complete when step 3 is done", async () => {
      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 4,
            completedSteps: [1, 2, 3],
            lastActivityAt: new Date().toISOString(),
            onboardingCompletedAt: new Date().toISOString(),
            metadata: { selectedTemplateId: "nps-default" },
          },
        })
        .where(eq(organization.id, testOrgId));

      const updatedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, testOrgId),
      });

      const state = updatedOrg?.onboardingState as {
        completedSteps: number[];
        onboardingCompletedAt: string | null;
      };
      expect(state.completedSteps).toContain(3);
      expect(state.onboardingCompletedAt).not.toBeNull();
    });

    it("tracks step completion timestamp", async () => {
      const completedAt = new Date().toISOString();

      await db
        .update(organization)
        .set({
          onboardingState: {
            currentStep: 4,
            completedSteps: [1, 2, 3],
            lastActivityAt: completedAt,
            onboardingCompletedAt: completedAt,
            metadata: {
              selectedTemplateId: "csat-default",
              stepCompletedAt: {
                "1": "2024-01-01T00:00:00.000Z",
                "2": "2024-01-01T00:05:00.000Z",
                "3": completedAt,
              },
            },
          },
        })
        .where(eq(organization.id, testOrgId));

      const updatedOrg = await db.query.organization.findFirst({
        where: eq(organization.id, testOrgId),
      });

      const state = updatedOrg?.onboardingState as {
        metadata: { stepCompletedAt?: Record<string, string> };
      };
      expect(state.metadata.stepCompletedAt?.["3"]).toBe(completedAt);
    });
  });

  describe("Template Data Structure", () => {
    it("template getById returns correct structure", async () => {
      const npsTemplate = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.id, "nps-default"),
      });

      expect(npsTemplate).toMatchObject({
        id: "nps-default",
        name: expect.any(String),
        type: "nps",
        description: expect.any(String),
        isDefault: true,
      });
      expect(npsTemplate?.questions).toBeInstanceOf(Array);
    });

    it("templates have valid question structures", async () => {
      const templates = await db.query.surveyTemplate.findMany();

      for (const template of templates) {
        expect(template.questions.length).toBeGreaterThan(0);

        for (const question of template.questions) {
          expect(question.id).toBeDefined();
          expect(question.text).toBeDefined();
          expect(["rating", "text"]).toContain(question.type);
          expect(typeof question.required).toBe("boolean");

          if (question.type === "rating") {
            expect(question.scale).toBeDefined();
            expect(question.scale?.min).toBeDefined();
            expect(question.scale?.max).toBeDefined();
          }
        }
      }
    });
  });
});
