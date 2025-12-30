import type { JobHandler } from "@wp-nps/db";
import { db, survey, surveyDelivery, whatsappConnection } from "@wp-nps/db";
import { eq, and } from "drizzle-orm";
import { getKapsoClient } from "@wp-nps/api/lib/kapso";

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

export const surveySendHandler: JobHandler = {
  async handle(job) {
    if (!isSurveySendPayload(job.payload)) {
      throw new Error("Invalid survey send payload");
    }

    const { deliveryId, surveyId, phoneNumber } = job.payload;
    const kapso = getKapsoClient();

    const surveyRecord = await db.query.survey.findFirst({
      where: eq(survey.id, surveyId),
    });

    if (!surveyRecord) {
      throw new Error(`Survey ${surveyId} not found`);
    }

    const connection = await db.query.whatsappConnection.findFirst({
      where: and(
        eq(whatsappConnection.orgId, job.orgId),
        eq(whatsappConnection.status, "active"),
      ),
    });

    if (!connection?.phoneNumber) {
      await db
        .update(surveyDelivery)
        .set({
          status: "failed",
          errorMessage: "No active WhatsApp connection",
          updatedAt: new Date(),
        })
        .where(eq(surveyDelivery.id, deliveryId));
      return;
    }

    const firstQuestion = surveyRecord.questions[0];
    const questionText = firstQuestion?.text ?? "How likely are you to recommend us? Reply 0-10";

    const result = await kapso.sendSurvey({
      orgId: connection.phoneNumber,
      phoneNumber,
      surveyId,
      message: questionText,
    });

    await db
      .update(surveyDelivery)
      .set({
        status: "sent",
        kapsoDeliveryId: result.deliveryId,
        updatedAt: new Date(),
      })
      .where(eq(surveyDelivery.id, deliveryId));
  },
};
