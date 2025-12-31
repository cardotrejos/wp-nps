import { eq, sql } from "drizzle-orm";
import { db, webhookJob } from "@wp-nps/db";
import type { EnqueueJobParams, WebhookJobPayload } from "@wp-nps/db";

export interface AcquiredJob {
  id: string;
  orgId: string;
  idempotencyKey: string;
  source: string;
  eventType: string;
  payload: WebhookJobPayload;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function enqueueJob(params: EnqueueJobParams): Promise<string | null> {
  const result = await db
    .insert(webhookJob)
    .values({
      orgId: params.orgId,
      idempotencyKey: params.idempotencyKey,
      source: params.source,
      eventType: params.eventType,
      payload: params.payload,
      maxAttempts: params.maxAttempts ?? 3,
    })
    .onConflictDoNothing({ target: webhookJob.idempotencyKey })
    .returning({ id: webhookJob.id });

  const inserted = result[0];
  return inserted?.id ?? null;
}

export async function acquireNextJob(): Promise<AcquiredJob | null> {
  const result = await db.execute(sql`
    UPDATE webhook_job
    SET status = 'processing', updated_at = NOW()
    WHERE id = (
      SELECT id FROM webhook_job
      WHERE status = 'pending' AND next_retry_at <= NOW()
      ORDER BY next_retry_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING 
      id,
      org_id as "orgId",
      idempotency_key as "idempotencyKey",
      source,
      event_type as "eventType",
      payload,
      status,
      attempts,
      max_attempts as "maxAttempts",
      next_retry_at as "nextRetryAt",
      processed_at as "processedAt",
      error_message as "errorMessage",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `);

  const row = result.rows[0] as unknown as AcquiredJob | undefined;
  return row ?? null;
}

export async function acquireJobById(jobId: string): Promise<AcquiredJob | null> {
  const result = await db.execute(sql`
    UPDATE webhook_job
    SET status = 'processing', updated_at = NOW()
    WHERE id = ${jobId} AND status = 'pending'
    RETURNING 
      id,
      org_id as "orgId",
      idempotency_key as "idempotencyKey",
      source,
      event_type as "eventType",
      payload,
      status,
      attempts,
      max_attempts as "maxAttempts",
      next_retry_at as "nextRetryAt",
      processed_at as "processedAt",
      error_message as "errorMessage",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `);

  const row = result.rows[0] as unknown as AcquiredJob | undefined;
  return row ?? null;
}

export async function completeJob(jobId: string): Promise<void> {
  await db
    .update(webhookJob)
    .set({
      status: "completed",
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(webhookJob.id, jobId));
}

export async function failJob(jobId: string, error: Error): Promise<void> {
  const job = await db.query.webhookJob.findFirst({
    where: eq(webhookJob.id, jobId),
  });

  if (!job) return;

  const newAttempts = job.attempts + 1;
  const shouldRetry = newAttempts < job.maxAttempts;

  await db
    .update(webhookJob)
    .set({
      status: shouldRetry ? "pending" : "failed",
      attempts: newAttempts,
      nextRetryAt: shouldRetry ? calculateNextRetry(newAttempts) : null,
      errorMessage: error.message,
      updatedAt: new Date(),
    })
    .where(eq(webhookJob.id, jobId));
}

export function calculateNextRetry(attempts: number): Date {
  const delayMs = Math.min(30_000 * Math.pow(4, attempts - 1), 8 * 60 * 1000);
  return new Date(Date.now() + delayMs);
}

export async function getJobsByOrgId(orgId: string, status?: string): Promise<AcquiredJob[]> {
  const baseQuery = eq(webhookJob.orgId, orgId);

  if (status) {
    const jobs = await db.query.webhookJob.findMany({
      where: (table, { and, eq: eqOp }) => and(baseQuery, eqOp(table.status, status)),
    });
    return jobs as AcquiredJob[];
  }

  const jobs = await db.query.webhookJob.findMany({
    where: baseQuery,
  });
  return jobs as AcquiredJob[];
}
