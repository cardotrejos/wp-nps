import { Elysia } from "elysia";
import { sql } from "drizzle-orm";
import { parseKapsoWebhook } from "@wp-nps/kapso";
import { getKapsoClient } from "@wp-nps/api/lib/kapso";
import { enqueueJob } from "@wp-nps/api/services/job-queue";
import { db, whatsappConnection } from "@wp-nps/db";
import { secureLog } from "@wp-nps/api/utils/secure-logger";

export const kapsoWebhookRouter = new Elysia({ prefix: "/webhooks" }).post(
  "/kapso",
  async ({ request, body, set }) => {
    const kapso = getKapsoClient();

    const signature = request.headers.get("x-webhook-signature");
    if (!signature) {
      set.status = 401;
      return { error: "Missing signature" };
    }

    const rawBody = JSON.stringify(body);
    if (!kapso.verifyWebhook(signature, rawBody)) {
      secureLog.warn("Invalid webhook signature received");
      set.status = 401;
      return { error: "Invalid signature" };
    }

    let parsed;
    try {
      parsed = parseKapsoWebhook(body);
    } catch (err) {
      secureLog.warn("Invalid webhook payload", {
        error: err instanceof Error ? err.message : "Unknown",
        receivedPayload: JSON.stringify(body),
      });
      set.status = 400;
      return { error: "Invalid payload" };
    }

    if (parsed.direction !== "inbound") {
      return { status: "ignored", reason: "Not an inbound message" };
    }

    const connection = await db.query.whatsappConnection.findFirst({
      where: sql`${whatsappConnection.metadata}->>'phoneNumberId' = ${parsed.phoneNumberId}`,
    });

    if (!connection) {
      secureLog.warn("Webhook received for unknown phone_number_id", {
        phoneNumberId: parsed.phoneNumberId,
      });
      set.status = 404;
      return { error: "Unknown phone number" };
    }

    const idempotencyKey = `kapso:${parsed.messageId}`;

    const jobId = await enqueueJob({
      orgId: connection.orgId,
      idempotencyKey,
      source: "kapso",
      eventType: "kapso.message.received",
      payload: {
        phoneNumberId: parsed.phoneNumberId,
        customerPhone: parsed.customerPhone,
        messageId: parsed.messageId,
        content: parsed.content,
      },
    });

    if (jobId === null) {
      secureLog.info("Duplicate webhook ignored", { messageId: parsed.messageId });
      set.status = 200;
      return { status: "duplicate" };
    }

    secureLog.info("Webhook queued for processing", { jobId, messageId: parsed.messageId });

    set.status = 202;
    return { status: "accepted", job_id: jobId };
  },
);
