import type { JobHandler } from "@wp-nps/db";

export const kapsoDeliveryStatusHandler: JobHandler = {
  async handle(job) {
    console.log(`[KapsoDeliveryStatus] Processing job ${job.id}`);
    console.log(`[KapsoDeliveryStatus] Event: ${job.eventType}`);
    console.log(`[KapsoDeliveryStatus] Payload:`, job.payload);
  },
};
