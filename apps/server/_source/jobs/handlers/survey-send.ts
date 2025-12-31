import type { JobHandler } from "@wp-nps/db";
import { db, survey, surveyDelivery, whatsappConnection } from "@wp-nps/db";
import { organization } from "@wp-nps/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { getKapsoClient } from "@wp-nps/api/lib/kapso";
import { KapsoError } from "@wp-nps/kapso";
import { formatSurveyMessage, type SurveyType } from "@wp-nps/api/services/survey-message";

interface SurveySendPayload {
  deliveryId: string;
  surveyId: string;
  phoneNumber: string;
  metadata?: Record<string, unknown>;
}

function isSurveySendPayload(payload: unknown): payload is SurveySendPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "deliveryId" in payload &&
    "surveyId" in payload &&
    "phoneNumber" in payload
  );
}

async function updateDeliveryStatus(
  deliveryId: string,
  status: "sent" | "failed" | "undeliverable",
  kapsoDeliveryId?: string,
  errorMessage?: string,
): Promise<void> {
  await db
    .update(surveyDelivery)
    .set({
      status,
      kapsoDeliveryId,
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(surveyDelivery.id, deliveryId));
}

export const surveySendHandler: JobHandler = {
  async handle(job) {
    if (!isSurveySendPayload(job.payload)) {
      throw new Error("Invalid survey send payload");
    }

    const { deliveryId, surveyId, phoneNumber, metadata } = job.payload;
    const kapso = getKapsoClient();

    const surveyRecord = await db.query.survey.findFirst({
      where: eq(survey.id, surveyId),
    });

    if (!surveyRecord) {
      await updateDeliveryStatus(deliveryId, "undeliverable", undefined, "Survey not found");
      return;
    }

    const orgRecord = await db.query.organization.findFirst({
      where: eq(organization.id, surveyRecord.orgId),
    });

    const connection = await db.query.whatsappConnection.findFirst({
      where: and(eq(whatsappConnection.orgId, job.orgId), eq(whatsappConnection.status, "active")),
    });

    if (!connection?.phoneNumber) {
      await updateDeliveryStatus(
        deliveryId,
        "undeliverable",
        undefined,
        "No active WhatsApp connection",
      );
      return;
    }

    const firstQuestion = surveyRecord.questions[0];
    const questionText = firstQuestion?.text ?? "How would you rate your experience?";

    const message = formatSurveyMessage({
      surveyType: surveyRecord.type as SurveyType,
      questionText,
      customerName: metadata?.customer_name as string | undefined,
      orgName: orgRecord?.name ?? "Our company",
    });

    try {
      const result = await kapso.sendSurvey({
        orgId: connection.phoneNumber,
        phoneNumber,
        surveyId,
        message,
      });

      await updateDeliveryStatus(deliveryId, "sent", result.deliveryId);
    } catch (error) {
      const isLastAttempt = job.attempts + 1 >= 3;

      if (error instanceof KapsoError) {
        if (!error.isRetryable || isLastAttempt) {
          await updateDeliveryStatus(deliveryId, "undeliverable", undefined, error.message);
          return;
        }

        await updateDeliveryStatus(deliveryId, "failed", undefined, error.message);
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (isLastAttempt) {
        await updateDeliveryStatus(deliveryId, "undeliverable", undefined, errorMessage);
        return;
      }

      await updateDeliveryStatus(deliveryId, "failed", undefined, errorMessage);
      throw error;
    }
  },
};
