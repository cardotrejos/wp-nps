import type { IKapsoClient } from "@wp-nps/kapso";
import { createKapsoClient } from "@wp-nps/kapso";
import { env } from "@wp-nps/env/server";

let kapsoClient: IKapsoClient | null = null;

export function getKapsoClient(): IKapsoClient {
  if (!kapsoClient) {
    const isTestEnv = env.NODE_ENV === "test";

    if (!isTestEnv && (!env.KAPSO_API_KEY || !env.KAPSO_WEBHOOK_SECRET)) {
      throw new Error(
        "Kapso credentials required: Set KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET environment variables",
      );
    }

    kapsoClient = createKapsoClient({
      apiKey: env.KAPSO_API_KEY,
      webhookSecret: env.KAPSO_WEBHOOK_SECRET,
      baseUrl: env.KAPSO_BASE_URL,
    });
  }
  return kapsoClient;
}

export function setKapsoClient(client: IKapsoClient): void {
  kapsoClient = client;
}

export function resetKapsoClient(): void {
  kapsoClient = null;
}
