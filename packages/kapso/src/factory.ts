import type { IKapsoClient } from "./types";
import { KapsoMockClient } from "./mock";
import { KapsoClient } from "./client";

export interface KapsoFactoryConfig {
  apiKey?: string;
  webhookSecret?: string;
  baseUrl?: string;
  forceReal?: boolean;
}

/**
 * Create a Kapso client based on environment.
 *
 * In test environment (NODE_ENV=test), returns KapsoMockClient.
 * In production, returns real KapsoClient with provided credentials.
 *
 * @param config - Configuration for the client
 * @returns IKapsoClient implementation (mock or real)
 * @throws Error if production mode but missing credentials
 */
export function createKapsoClient(config: KapsoFactoryConfig = {}): IKapsoClient {
  const isTest = process.env.NODE_ENV === "test";

  if (isTest && !config.forceReal) {
    return new KapsoMockClient();
  }

  if (!config.apiKey || !config.webhookSecret) {
    throw new Error(
      "KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET are required in production mode",
    );
  }

  return new KapsoClient({
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
    baseUrl: config.baseUrl,
  });
}
