import type { IKapsoClient } from "@wp-nps/kapso";
import { KapsoMockClient } from "@wp-nps/kapso";

/**
 * Kapso Client Factory (Story 2.5)
 *
 * Provides dependency injection for Kapso client.
 * - In tests: Use KapsoMockClient (set via setKapsoClient)
 * - In production: Real client (Story 3.0)
 * - For MVP: Default to mock client
 *
 * CRITICAL: Tests must use KapsoMockClient to avoid real API calls.
 */

let kapsoClient: IKapsoClient | null = null;

/**
 * Get the current Kapso client instance.
 * Creates a new mock client if none is set.
 */
export function getKapsoClient(): IKapsoClient {
  if (!kapsoClient) {
    // For MVP, default to mock client
    // Real client implementation comes in Story 3.0
    kapsoClient = new KapsoMockClient();
  }
  return kapsoClient;
}

/**
 * Set the Kapso client instance.
 * Use this in tests to inject a mock client with specific behavior.
 */
export function setKapsoClient(client: IKapsoClient): void {
  kapsoClient = client;
}

/**
 * Reset the Kapso client to null.
 * Call this in test cleanup to ensure fresh state.
 */
export function resetKapsoClient(): void {
  kapsoClient = null;
}
