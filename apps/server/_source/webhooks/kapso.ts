import { Elysia } from "elysia";
import { sql } from "drizzle-orm";
import { parseKapsoWebhook } from "@wp-nps/kapso";
import { getKapsoClient } from "@wp-nps/api/lib/kapso";
import { enqueueJob, completeJob } from "@wp-nps/api/services/job-queue";
import { processFlowResponse } from "@wp-nps/api/services/response-processor";
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

    let messages;
    try {
      messages = parseKapsoWebhook(body);
    } catch (err) {
      secureLog.warn("Invalid webhook payload", {
        error: err instanceof Error ? err.message : "Unknown",
      });
      set.status = 400;
      return { error: "Invalid payload" };
    }

    const inboundMessages = messages.filter((m) => m.direction === "inbound");
    if (inboundMessages.length === 0) {
      return { status: "ignored", reason: "No inbound messages" };
    }

    const results: { messageId: string; status: string; jobId?: string }[] = [];

    for (const parsed of inboundMessages) {
      const connection = await db.query.whatsappConnection.findFirst({
        where: sql`${whatsappConnection.metadata}->>'phoneNumberId' = ${parsed.phoneNumberId}`,
      });

      if (!connection) {
        secureLog.warn("Webhook received for unknown phone_number_id", {
          phoneNumberId: parsed.phoneNumberId,
        });
        results.push({ messageId: parsed.messageId, status: "unknown_phone" });
        continue;
      }

      const idempotencyKey = `kapso:${parsed.messageId}`;

      const jobId = await enqueueJob({
        orgId: connection.orgId,
        idempotencyKey,
        source: "kapso",
        eventType: parsed.messageType === "flow_response" ? "kapso.flow.response" : "kapso.message.received",
        payload: {
          phoneNumberId: parsed.phoneNumberId,
          customerPhone: parsed.customerPhone,
          messageId: parsed.messageId,
          content: parsed.content,
          messageType: parsed.messageType,
          flowResponse: parsed.flowResponse,
        },
      });

      if (jobId === null) {
        secureLog.info("Duplicate webhook ignored", { messageId: parsed.messageId });
        results.push({ messageId: parsed.messageId, status: "duplicate" });
        continue;
      }

      if (parsed.messageType === "flow_response" && parsed.flowResponse) {
        try {
          const result = await processFlowResponse({
            orgId: connection.orgId,
            customerPhone: parsed.customerPhone,
            flowResponse: parsed.flowResponse,
            messageId: parsed.messageId,
          });

          if (result) {
            await completeJob(jobId);
            secureLog.info("Flow response processed", {
              jobId,
              messageId: parsed.messageId,
              responseId: result.responseId,
              category: result.category,
            });
            results.push({ messageId: parsed.messageId, status: "processed", jobId });
            continue;
          }
        } catch (err) {
          secureLog.warn("Flow response processing failed, job remains queued", {
            jobId,
            messageId: parsed.messageId,
            error: err instanceof Error ? err.message : "Unknown",
          });
        }
      }

      secureLog.info("Webhook queued for processing", { jobId, messageId: parsed.messageId });
      results.push({ messageId: parsed.messageId, status: "accepted", jobId });
    }

    set.status = 202;
    return { status: "processed", results };
  },
);
