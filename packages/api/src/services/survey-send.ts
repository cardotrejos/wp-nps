import { createHash } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db, survey, surveyDelivery } from "@wp-nps/db";
import { enqueueJob } from "./job-queue";

export type SurveySendErrorCode =
  | "SURVEY_NOT_FOUND"
  | "SURVEY_INACTIVE"
  | "INVALID_PHONE"
  | "QUEUE_FAILED";

export class SurveySendError extends Error {
  constructor(
    message: string,
    public code: SurveySendErrorCode,
  ) {
    super(message);
    this.name = "SurveySendError";
  }
}

interface QueueSurveySendParams {
  orgId: string;
  surveyId: string;
  phoneNumber: string;
  metadata?: Record<string, unknown>;
  isTest?: boolean;
}

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function isValidE164Phone(phone: string): boolean {
  return E164_REGEX.test(phone);
}

function hashPhoneNumber(phoneNumber: string): string {
  return createHash("sha256").update(phoneNumber).digest("hex");
}

export async function queueSurveySend(
  params: QueueSurveySendParams,
): Promise<string> {
  const { orgId, surveyId, phoneNumber, metadata, isTest = false } = params;

  if (!isValidE164Phone(phoneNumber)) {
    throw new SurveySendError(
      "Phone number must be in E.164 format (e.g., +5511999999999)",
      "INVALID_PHONE",
    );
  }

  const surveyRecord = await db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.orgId, orgId)),
  });

  if (!surveyRecord) {
    throw new SurveySendError("Survey not found", "SURVEY_NOT_FOUND");
  }

  if (surveyRecord.status !== "active") {
    throw new SurveySendError("Survey is not active", "SURVEY_INACTIVE");
  }

  const phoneNumberHash = hashPhoneNumber(phoneNumber);

  const [delivery] = await db
    .insert(surveyDelivery)
    .values({
      orgId,
      surveyId,
      phoneNumber,
      phoneNumberHash,
      metadata,
      isTest,
      status: "pending",
    })
    .returning({ id: surveyDelivery.id });

  if (!delivery) {
    throw new SurveySendError("Failed to create delivery record", "QUEUE_FAILED");
  }

  const jobId = await enqueueJob({
    orgId,
    idempotencyKey: `survey-send:${delivery.id}`,
    source: "internal",
    eventType: "internal.survey.send",
    payload: {
      deliveryId: delivery.id,
      surveyId,
      phoneNumber,
      metadata,
    },
  });

  if (!jobId) {
    throw new SurveySendError("Failed to queue job", "QUEUE_FAILED");
  }

  await db
    .update(surveyDelivery)
    .set({ status: "queued", updatedAt: new Date() })
    .where(eq(surveyDelivery.id, delivery.id));

  return delivery.id;
}
