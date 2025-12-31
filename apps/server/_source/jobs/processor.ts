import { acquireNextJob, completeJob, failJob } from "@wp-nps/api/services/job-queue";
import { handlers } from "./handlers";

const POLL_INTERVAL_MS = 5_000;
let isRunning = false;
let intervalId: Timer | null = null;

export function startProcessor(): void {
  if (isRunning) return;
  isRunning = true;

  console.log("[JobProcessor] Starting with 5s polling interval");

  intervalId = setInterval(processNextJob, POLL_INTERVAL_MS);
  processNextJob();
}

export function stopProcessor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log("[JobProcessor] Stopped");
}

export function isProcessorRunning(): boolean {
  return isRunning;
}

async function processNextJob(): Promise<void> {
  const job = await acquireNextJob();
  if (!job) return;

  console.log(`[JobProcessor] Processing job ${job.id} (${job.eventType})`);

  try {
    const handler = handlers[job.eventType];
    if (!handler) {
      throw new Error(`No handler registered for event type: ${job.eventType}`);
    }
    await handler.handle(job);
    await completeJob(job.id);
    console.log(`[JobProcessor] Completed job ${job.id}`);
  } catch (error) {
    console.error(`[JobProcessor] Failed job ${job.id}:`, error);
    await failJob(job.id, error as Error);
  }
}

process.on("SIGTERM", stopProcessor);
process.on("SIGINT", stopProcessor);
