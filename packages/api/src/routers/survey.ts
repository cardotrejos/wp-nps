import { createHash } from "node:crypto";
import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import {
  survey,
  surveyDelivery,
  whatsappConnection,
  type SurveyQuestion,
} from "@wp-nps/db/schema/flowpulse";
import { surveyTemplate } from "@wp-nps/db/schema/survey-template";

import { protectedProcedure } from "../index";
import { getKapsoClient } from "../lib/kapso";
import { queueSurveySend, SurveySendError } from "../services/survey-send";
import { maskPhoneNumber } from "../utils/phone-mask";
import { hashPhoneNumber } from "../utils/hash";

/**
 * Survey Router (Story 2.1, 2.2, 2.7)
 *
 * Manages surveys for organizations.
 * All procedures filter by orgId for multi-tenancy (AR8, AR11).
 */

export const surveyRouter = {
  /**
   * Update survey trigger type (Story 2.7)
   * Changes triggerType to 'api' or 'manual'
   * CRITICAL: Validates org isolation
   */
  updateTriggerType: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        triggerType: z.enum(["api", "manual"]),
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

      // Update trigger type
      const result = await db
        .update(survey)
        .set({
          triggerType: input.triggerType,
          updatedAt: new Date(),
        })
        .where(and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)))
        .returning();

      const updatedSurvey = result[0];
      if (!updatedSurvey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update trigger type",
        });
      }

      return updatedSurvey;
    }),

  /**
   * Activate a survey (Story 2.6)
   * Changes status to 'active' and isActive to true
   * CRITICAL: Validates org isolation and question count
   */
  activate: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
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

      // Validate survey has at least one question (AC #3)
      const questions = existingSurvey.questions ?? [];
      if (questions.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Add at least one question before activating",
        });
      }

      // Update status to active (AC #1)
      const result = await db
        .update(survey)
        .set({
          status: "active",
          isActive: true,
          updatedAt: new Date(),
        })
        .where(and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)))
        .returning();

      const updatedSurvey = result[0];
      if (!updatedSurvey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to activate survey",
        });
      }

      return updatedSurvey;
    }),

  /**
   * Deactivate a survey (Story 2.6)
   * Changes status to 'inactive' and isActive to false
   * CRITICAL: Validates org isolation
   */
  deactivate: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
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

      // Update status to inactive (AC #2)
      const result = await db
        .update(survey)
        .set({
          status: "inactive",
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)))
        .returning();

      const updatedSurvey = result[0];
      if (!updatedSurvey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to deactivate survey",
        });
      }

      return updatedSurvey;
    }),

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

  /**
   * Send a test survey to the user's own WhatsApp (Story 2.5)
   *
   * CRITICAL: Multi-tenancy enforced via orgId filter
   * - Validates survey belongs to org
   * - Validates WhatsApp connection is active
   * - Creates delivery record with isTest = true
   */
  sendTest: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
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

      // Fetch WhatsApp connection for this org
      const connection = await db.query.whatsappConnection.findFirst({
        where: eq(whatsappConnection.orgId, orgId),
      });

      // Validate connection exists and has valid status
      if (!connection || (connection.status !== "active" && connection.status !== "verified")) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Please connect WhatsApp first",
        });
      }

      if (!connection.phoneNumber) {
        throw new ORPCError("BAD_REQUEST", {
          message: "WhatsApp connection missing phone number",
        });
      }

      // Get Kapso client (uses mock in tests, real client in production)
      const kapsoClient = getKapsoClient();

      // Build survey message from questions
      const questions = existingSurvey.questions ?? [];
      const messageText = questions.map((q) => q.text).join("\n\n");

      // Send via Kapso with error handling
      let result: { deliveryId: string; status: string };
      try {
        result = await kapsoClient.sendSurvey({
          phoneNumber: connection.phoneNumber,
          surveyId: input.surveyId,
          orgId,
          message: messageText,
          metadata: { isTest: true },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send survey";
        throw new ORPCError("BAD_REQUEST", {
          message: `Kapso error: ${errorMessage}`,
        });
      }

      await db.insert(surveyDelivery).values({
        orgId,
        surveyId: input.surveyId,
        phoneNumber: connection.phoneNumber,
        phoneNumberHash: createHash("sha256").update(connection.phoneNumber).digest("hex"),
        status: result.status,
        isTest: true,
        kapsoDeliveryId: result.deliveryId,
      });

      return {
        success: true,
        deliveryId: result.deliveryId,
        status: result.status,
      };
    }),

  /**
   * Send a survey manually to a phone number (Story 3.10)
   *
   * CRITICAL: Multi-tenancy enforced via orgId filter
   * - Validates survey belongs to org and is active
   * - Validates phone format (E.164)
   * - Creates delivery record and queues for sending
   */
  sendManual: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        phone: z.string(),
        metadata: z
          .object({
            order_id: z.string().optional(),
            customer_name: z.string().optional(),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      try {
        const deliveryId = await queueSurveySend({
          orgId,
          surveyId: input.surveyId,
          phoneNumber: input.phone,
          metadata: input.metadata as Record<string, unknown> | undefined,
          isTest: false,
        });

        return {
          deliveryId,
          phone: maskPhoneNumber(input.phone),
          status: "queued",
        };
      } catch (error) {
        if (error instanceof SurveySendError) {
          const errorCodeMap: Record<string, "NOT_FOUND" | "BAD_REQUEST"> = {
            SURVEY_NOT_FOUND: "NOT_FOUND",
            SURVEY_INACTIVE: "BAD_REQUEST",
            INVALID_PHONE: "BAD_REQUEST",
            QUEUE_FAILED: "BAD_REQUEST",
          };
          throw new ORPCError(errorCodeMap[error.code] ?? "BAD_REQUEST", {
            message: error.message,
          });
        }
        throw error;
      }
    }),

  sendFlowDirect: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        flowId: z.string(),
        surveyId: z.string().uuid().optional(),
        flowCta: z.string().default("Start Survey"),
        bodyText: z.string().default("Please complete this quick survey"),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const connection = await db.query.whatsappConnection.findFirst({
        where: and(eq(whatsappConnection.orgId, orgId), eq(whatsappConnection.status, "active")),
      });

      if (!connection) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "WhatsApp not connected. Please connect WhatsApp first.",
        });
      }

      const metadata = connection.metadata as { phoneNumberId?: string } | null;
      const phoneNumberId = metadata?.phoneNumberId;

      if (!phoneNumberId) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "WhatsApp configuration not found. Please reconnect WhatsApp.",
        });
      }

      let surveyIdToUse = input.surveyId;
      if (!surveyIdToUse) {
        const existingSurvey = await db.query.survey.findFirst({
          where: eq(survey.orgId, orgId),
          orderBy: [desc(survey.createdAt)],
        });
        
        if (!existingSurvey) {
          throw new ORPCError("PRECONDITION_FAILED", {
            message: "No survey found. Create a survey first or provide a surveyId.",
          });
        }
        surveyIdToUse = existingSurvey.id;
      }

      const kapsoClient = getKapsoClient();

      const result = await kapsoClient.sendFlow({
        phoneNumber: input.phone,
        orgId: phoneNumberId,
        flowId: input.flowId,
        flowCta: input.flowCta,
        bodyText: input.bodyText,
        flowAction: "navigate",
      });

      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId,
          surveyId: surveyIdToUse,
          phoneNumber: input.phone,
          phoneNumberHash: hashPhoneNumber(input.phone),
          status: result.status,
          isTest: true,
          kapsoDeliveryId: result.deliveryId,
          metadata: { flowId: input.flowId, flowCta: input.flowCta },
        })
        .returning({ id: surveyDelivery.id });

      return {
        success: true,
        deliveryId: result.deliveryId,
        dbDeliveryId: delivery?.id,
        status: result.status,
        phone: maskPhoneNumber(input.phone),
      };
    }),
};
