import { enqueueJob } from "@wp-nps/api/services/job-queue";

const HOUR_MS = 60 * 60 * 1000;
const SYSTEM_ORG_ID = "system";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerInterval) {
    console.log("[Scheduler] Already running");
    return;
  }

  scheduleAbandonmentCheck();

  schedulerInterval = setInterval(() => {
    scheduleAbandonmentCheck();
  }, HOUR_MS);

  console.log("[Scheduler] Started (hourly abandonment checks)");
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}

async function scheduleAbandonmentCheck(): Promise<void> {
  try {
    const now = new Date();
    const hourKey = `${now.toISOString().split("T")[0]}-${now.getUTCHours()}`;

    await enqueueJob({
      orgId: SYSTEM_ORG_ID,
      idempotencyKey: `abandonment-check-${hourKey}`,
      source: "internal",
      eventType: "internal.onboarding.abandonment_check",
      payload: { scheduledAt: now.toISOString() },
    });

    console.log(`[Scheduler] Queued abandonment check (${hourKey})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("duplicate key")) {
      return;
    }
    console.error("[Scheduler] Failed to schedule abandonment check:", error);
  }
}
