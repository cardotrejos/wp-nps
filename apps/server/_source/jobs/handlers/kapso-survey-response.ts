import type { JobHandler } from "@wp-nps/db";

export const kapsoSurveyResponseHandler: JobHandler = {
  async handle(job) {
    console.log(`[KapsoSurveyResponse] Processing job ${job.id}`);
    console.log(`[KapsoSurveyResponse] Payload:`, job.payload);
  },
};
