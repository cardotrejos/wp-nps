import type { JobHandler, KapsoWebhookReceivedPayload } from "@wp-nps/db";
import { db, surveyDelivery } from "@wp-nps/db";
import { eq, and, desc } from "drizzle-orm";
import { parseSurveyResponse } from "@wp-nps/kapso";
import { processResponse } from "@wp-nps/api/services/response-processor";
import { hashPhoneNumber } from "@wp-nps/api/utils/hash";

export const kapsoSurveyResponseHandler: JobHandler = {
  async handle(job) {
    const payload = job.payload as KapsoWebhookReceivedPayload;
    const phoneHash = hashPhoneNumber(payload.customerPhone);

    const delivery = await db.query.surveyDelivery.findFirst({
      where: and(
        eq(surveyDelivery.orgId, job.orgId),
        eq(surveyDelivery.phoneNumberHash, phoneHash),
        eq(surveyDelivery.status, "sent")
      ),
      with: {
        survey: true,
      },
      orderBy: [desc(surveyDelivery.createdAt)],
    });

    if (!delivery) {
      console.log("[KapsoSurveyResponse] No matching delivery found, ignoring message");
      return;
    }

    const surveyType = (delivery.survey?.type as "nps" | "csat" | "ces") ?? "nps";
    const parsed = parseSurveyResponse(payload.content, surveyType);

    if (parsed.score === null) {
      console.log("[KapsoSurveyResponse] Could not parse score from message, ignoring");
      return;
    }

    try {
      await processResponse({
        orgId: job.orgId,
        customerPhone: payload.customerPhone,
        score: parsed.score,
        feedback: parsed.feedback,
        messageId: payload.messageId,
      });

      console.log(
        `[KapsoSurveyResponse] Processed response for delivery ${delivery.id}, score: ${parsed.score}`
      );
    } catch (error) {
      console.error(
        `[KapsoSurveyResponse] Failed to process response for delivery ${delivery.id}:`,
        error instanceof Error ? error.message : error
      );
      throw error; // Re-throw to let job queue handle retry logic
    }
  },
};
