import type { JobHandler } from "@wp-nps/db";
import { kapsoSurveyResponseHandler } from "./kapso-survey-response";
import { kapsoDeliveryStatusHandler } from "./kapso-delivery-status";
import { surveySendHandler } from "./survey-send";
import { onboardingAbandonmentCheckHandler } from "./onboarding-abandonment-check";
import { sendOnboardingReminderHandler } from "./send-onboarding-reminder";

export const handlers: Record<string, JobHandler> = {
  "kapso.message.received": kapsoSurveyResponseHandler,
  "kapso.message.sent": kapsoDeliveryStatusHandler,
  "kapso.message.delivered": kapsoDeliveryStatusHandler,
  "kapso.message.failed": kapsoDeliveryStatusHandler,
  "internal.survey.send": surveySendHandler,
  "internal.onboarding.abandonment_check": onboardingAbandonmentCheckHandler,
  "internal.email.onboarding_reminder": sendOnboardingReminderHandler,
};
