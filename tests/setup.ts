// Note: Environment variables are set in env-setup.ts which runs first

import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

beforeAll(async () => {
  // Start MSW server with strict mode
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(async () => {
  // Clean up MSW
  server.close();
});

// Test utilities for org context
export async function withTestOrg<T>(
  _orgId: string,
  fn: () => Promise<T>,
): Promise<T> {
  // This would set up the org context for database operations
  // In the actual implementation, this sets the PostgreSQL session variable
  return fn();
}

// Helper to create unique test identifiers
export function testId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
