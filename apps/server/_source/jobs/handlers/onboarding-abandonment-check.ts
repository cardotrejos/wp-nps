import type { JobHandler } from "@wp-nps/db";
import { db, organization, member } from "@wp-nps/db";
import { eq, and, sql } from "drizzle-orm";
import { enqueueJob } from "@wp-nps/api/services/job-queue";

const ABANDONMENT_THRESHOLD_HOURS = 24;
const BATCH_LIMIT = 100;

export const onboardingAbandonmentCheckHandler: JobHandler = {
  async handle(_job) {
    try {
      const thresholdTime = new Date(Date.now() - ABANDONMENT_THRESHOLD_HOURS * 60 * 60 * 1000);

      const abandonedOrgs = await db
        .select({
          orgId: organization.id,
          userId: member.userId,
          currentStep: sql<number>`(${organization.onboardingState}->>'currentStep')::int`,
          lastActivityAt: sql<string>`${organization.onboardingState}->>'lastActivityAt'`,
        })
        .from(organization)
        .innerJoin(
          member,
          and(eq(member.organizationId, organization.id), eq(member.role, "owner")),
        )
        .where(
          and(
            sql`${organization.onboardingState}->>'onboardingCompletedAt' IS NULL`,
            sql`(${organization.onboardingState}->>'lastActivityAt')::timestamp < ${thresholdTime.toISOString()}`,
            sql`${organization.onboardingState}->>'lastActivityAt' IS NOT NULL`,
          ),
        )
        .limit(BATCH_LIMIT);

      console.log(`[AbandonmentCheck] Found ${abandonedOrgs.length} abandoned onboarding sessions`);

      const today = new Date().toISOString().split("T")[0];
      let queuedCount = 0;

      for (const org of abandonedOrgs) {
        try {
          await enqueueJob({
            orgId: org.orgId,
            idempotencyKey: `onboarding-reminder-${org.orgId}-${today}`,
            source: "internal",
            eventType: "internal.email.onboarding_reminder",
            payload: {
              orgId: org.orgId,
              userId: org.userId,
              currentStep: org.currentStep,
              lastActivityAt: org.lastActivityAt,
            },
          });
          queuedCount++;
        } catch (enqueueError) {
          const message = enqueueError instanceof Error ? enqueueError.message : "Unknown error";
          if (!message.includes("duplicate key")) {
            console.error(
              `[AbandonmentCheck] Failed to queue job for org ${org.orgId}:`,
              enqueueError,
            );
          }
        }
      }

      console.log(`[AbandonmentCheck] Queued ${queuedCount} reminder email jobs`);
    } catch (error) {
      console.error("[AbandonmentCheck] Failed to check for abandoned onboarding:", error);
      throw error;
    }
  },
};
