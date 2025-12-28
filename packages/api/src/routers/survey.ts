import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import { survey, type SurveyQuestion } from "@wp-nps/db/schema/flowpulse";
import { surveyTemplate } from "@wp-nps/db/schema/survey-template";

import { protectedProcedure } from "../index";

/**
 * Survey Router (Story 2.1, 2.2)
 *
 * Manages surveys for organizations.
 * All procedures filter by orgId for multi-tenancy (AR8, AR11).
 */

export const surveyRouter = {
  /**
   * Create a new survey from a template (Story 2.2)
   * Copies template questions to new survey with org isolation
   */
  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        name: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      // Fetch template
      const template = await db.query.surveyTemplate.findFirst({
        where: eq(surveyTemplate.id, input.templateId),
      });

      if (!template) {
        throw new ORPCError("NOT_FOUND", {
          message: "Template not found",
        });
      }

      // Generate default name: "{template.name} - Dec 27, 2025"
      const defaultName =
        input.name ??
        `${template.name} - ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;

      // Create survey with org isolation - CRITICAL: orgId from session
      const result = await db
        .insert(survey)
        .values({
          orgId, // CRITICAL: Set from session context
          name: defaultName,
          type: template.type,
          status: "draft",
          templateId: template.id,
          questions: template.questions, // Copy questions from template
        })
        .returning();

      const newSurvey = result[0];
      if (!newSurvey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create survey",
        });
      }

      return newSurvey;
    }),

  /**
   * List surveys for current organization
   * Returns paginated list sorted by created_at DESC
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      // Fetch surveys for org - CRITICAL: Always filter by orgId
      const surveys = await db.query.survey.findMany({
        where: eq(survey.orgId, orgId),
        orderBy: [desc(survey.createdAt)],
        limit,
        offset,
      });

      // Get total count for pagination
      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(survey)
        .where(eq(survey.orgId, orgId));

      const total = totalResult[0]?.count ?? 0;

      return {
        items: surveys,
        total,
        hasMore: offset + limit < total,
      };
    }),

  /**
   * Get a single survey by ID
   * SECURITY: Uses combined and() filter to prevent IDOR attacks
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      // CRITICAL: Always filter by BOTH id AND orgId in single query
      // This prevents IDOR by not revealing if survey exists for other orgs
      const foundSurvey = await db.query.survey.findFirst({
        where: and(eq(survey.id, input.id), eq(survey.orgId, orgId)),
      });

      if (!foundSurvey) {
        throw new ORPCError("NOT_FOUND", { message: "Survey not found" });
      }

      return foundSurvey;
    }),

  /**
   * Update a question's text in a survey (Story 2.3)
   * SECURITY: Uses combined and() filter to prevent IDOR attacks
   * Preserves all other question fields when updating text
   */
  updateQuestion: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        questionId: z.string(),
        text: z.string().min(1, "Question text is required"),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      // Fetch survey with org filter (CRITICAL: multi-tenancy)
      const existingSurvey = await db.query.survey.findFirst({
        where: and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)),
      });

      if (!existingSurvey) {
        throw new ORPCError("NOT_FOUND", {
          message: "Survey not found",
        });
      }

      // Find and update the question
      const questions = existingSurvey.questions ?? [];
      const questionIndex = questions.findIndex((q) => q.id === input.questionId);

      if (questionIndex === -1) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Question not found in survey",
        });
      }

      // Update question text (preserve other fields using spread)
      const originalQuestion = questions[questionIndex];
      if (!originalQuestion) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Question not found in survey",
        });
      }

      const updatedQuestions: SurveyQuestion[] = questions.map((q, index) =>
        index === questionIndex ? { ...originalQuestion, text: input.text } : q,
      );

      // Save updated questions - CRITICAL: Double-check org isolation
      const result = await db
        .update(survey)
        .set({
          questions: updatedQuestions,
          updatedAt: new Date(),
        })
        .where(and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)))
        .returning();

      const updatedSurvey = result[0];
      if (!updatedSurvey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update survey",
        });
      }

      return updatedSurvey;
    }),
};
