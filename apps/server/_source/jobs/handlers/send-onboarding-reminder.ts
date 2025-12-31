import type { JobHandler } from "@wp-nps/db";
import { db, organization, user, onboardingEmailLog } from "@wp-nps/db";
import { eq, and, gte } from "drizzle-orm";
import { getEmailClient } from "@wp-nps/api/lib/email";
import { renderOnboardingReminderEmail } from "@wp-nps/api/emails/onboarding-reminder";
import { env } from "@wp-nps/env/server";

interface OnboardingReminderPayload {
  orgId: string;
  userId: string;
  currentStep: number;
  lastActivityAt: string;
}

function isOnboardingReminderPayload(payload: unknown): payload is OnboardingReminderPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "orgId" in payload &&
    "userId" in payload &&
    "currentStep" in payload
  );
}

export const sendOnboardingReminderHandler: JobHandler = {
  async handle(job) {
    if (!isOnboardingReminderPayload(job.payload)) {
      throw new Error("Invalid onboarding reminder payload");
    }

    const payload = job.payload;
    const emailClient = getEmailClient();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReminder = await db.query.onboardingEmailLog.findFirst({
      where: and(
        eq(onboardingEmailLog.orgId, payload.orgId),
        eq(onboardingEmailLog.emailType, "reminder_24h"),
        gte(onboardingEmailLog.sentAt, twentyFourHoursAgo),
      ),
    });

    if (existingReminder) {
      console.log(`[OnboardingReminder] Skipping duplicate reminder for org ${payload.orgId}`);
      return;
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, payload.orgId),
    });

    if (!org) {
      console.log(`[OnboardingReminder] Org ${payload.orgId} not found, skipping`);
      return;
    }

    const onboardingState = org.onboardingState as { onboardingCompletedAt: string | null } | null;
    if (onboardingState?.onboardingCompletedAt) {
      console.log(`[OnboardingReminder] Org ${payload.orgId} completed onboarding, skipping`);
      return;
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, payload.userId),
    });

    if (!userData?.email) {
      console.log(`[OnboardingReminder] User ${payload.userId} has no email, skipping`);
      return;
    }

    const html = await renderOnboardingReminderEmail({
      userName: userData.name ?? "there",
      currentStep: payload.currentStep,
      resumeUrl: `${env.APP_URL}/onboarding?resume=true`,
    });

    await emailClient.send({
      to: userData.email,
      subject: "Let's finish setting up FlowPulse - it only takes 5 minutes!",
      html,
    });

    await db.insert(onboardingEmailLog).values({
      orgId: payload.orgId,
      userId: payload.userId,
      emailType: "reminder_24h",
    });

    console.log(`[OnboardingReminder] Sent reminder to ${userData.email}`);
  },
};
