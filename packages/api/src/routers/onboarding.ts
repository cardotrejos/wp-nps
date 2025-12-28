import { z } from "zod";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import {
  organization,
  onboardingStateSchema,
  defaultOnboardingState,
  type OnboardingState,
} from "@wp-nps/db/schema/auth";

import { protectedProcedure } from "../index";

/**
 * Onboarding Router (Story 1.4)
 *
 * Manages onboarding state persistence for organizations.
 * All procedures filter by orgId for multi-tenancy (AR8, AR11).
 *
 * Onboarding Steps:
 *   1 = Account Created (auto-complete on signup)
 *   2 = WhatsApp Connected (Stories 1.2 + 1.3)
 *   3 = Template Selected (Story 1.5)
 *   4 = Complete (redirect to dashboard)
 */

// Helper to get org with onboarding state
async function getOrgWithOnboardingState(orgId: string) {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (!org) {
    throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
  }

  // Parse onboarding state, fallback to default if not set
  const rawState = org.onboardingState ?? defaultOnboardingState;
  const state = onboardingStateSchema.parse(rawState);

  return { org, state };
}

export const onboardingRouter = {
  /**
   * Get current onboarding state for the organization
   */
  getState: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const { state } = await getOrgWithOnboardingState(orgId);
    return state;
  }),

  /**
   * Update the current step (navigation tracking)
   */
  updateStep: protectedProcedure
    .input(z.object({ step: z.number().min(1).max(4) }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const { state } = await getOrgWithOnboardingState(orgId);

      const newState: OnboardingState = {
        ...state,
        currentStep: input.step,
        lastActivityAt: new Date().toISOString(),
      };

      await db
        .update(organization)
        .set({ onboardingState: newState })
        .where(eq(organization.id, orgId));

      return newState;
    }),

  /**
   * Mark a step as completed
   */
  completeStep: protectedProcedure
    .input(
      z.object({
        step: z.number().min(1).max(4),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const { state } = await getOrgWithOnboardingState(orgId);

      // Add step to completed steps (no duplicates)
      const completedSteps = [...new Set([...state.completedSteps, input.step])];

      // Track when each step was completed
      const stepCompletedAt: Record<string, string> = {
        ...(state.metadata.stepCompletedAt ?? {}),
        [input.step.toString()]: new Date().toISOString(),
      };

      // Check if all required steps (1, 2, 3) are completed
      const isComplete = [1, 2, 3].every((s) => completedSteps.includes(s));

      const newState: OnboardingState = {
        currentStep: isComplete ? 4 : input.step + 1,
        completedSteps,
        lastActivityAt: new Date().toISOString(),
        onboardingCompletedAt: isComplete ? new Date().toISOString() : null,
        metadata: {
          ...state.metadata,
          ...input.metadata,
          stepCompletedAt,
        },
      };

      await db
        .update(organization)
        .set({ onboardingState: newState })
        .where(eq(organization.id, orgId));

      return newState;
    }),

  /**
   * Check if onboarding is complete
   */
  isComplete: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const { state } = await getOrgWithOnboardingState(orgId);

    // Complete if onboardingCompletedAt is set OR step 3 is in completedSteps
    const isComplete = state.onboardingCompletedAt != null || state.completedSteps.includes(3);

    return { isComplete };
  }),

  /**
   * Get organization info for time-to-value metric (Story 1.5 - Task 8)
   */
  getOrgCreatedAt: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { id: true, createdAt: true },
    });

    if (!org) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    return { orgId: org.id, createdAt: org.createdAt.toISOString() };
  }),

  /**
   * Update onboarding metadata (e.g., selected template, whatsapp status)
   */
  updateMetadata: protectedProcedure
    .input(
      z.object({
        metadata: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const { state } = await getOrgWithOnboardingState(orgId);

      const newState: OnboardingState = {
        ...state,
        lastActivityAt: new Date().toISOString(),
        metadata: {
          ...state.metadata,
          ...input.metadata,
        },
      };

      await db
        .update(organization)
        .set({ onboardingState: newState })
        .where(eq(organization.id, orgId));

      return newState;
    }),
};
