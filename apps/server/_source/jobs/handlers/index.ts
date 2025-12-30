import type { JobHandler } from "@wp-nps/db";
import { kapsoSurveyResponseHandler } from "./kapso-survey-response";
import { kapsoDeliveryStatusHandler } from "./kapso-delivery-status";
import { surveySendHandler } from "./survey-send";

export const handlers: Record<string, JobHandler> = {
  "kapso.message.received": kapsoSurveyResponseHandler,
  "kapso.message.sent": kapsoDeliveryStatusHandler,
  "kapso.message.delivered": kapsoDeliveryStatusHandler,
  "kapso.message.failed": kapsoDeliveryStatusHandler,
  "internal.survey.send": surveySendHandler,
};
