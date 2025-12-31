// Note: Environment variables are set in env-setup.ts which runs first

import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";
import { sql } from "drizzle-orm";
import { db } from "@wp-nps/db";

// Run RLS migration on test database
async function applyRlsPolicies() {
  // Enable RLS on all FlowPulse tables
  const tables = [
    "whatsapp_connection",
    "webhook_job",
    "org_metrics",
    "org_usage",
    "survey",
    "survey_response",
    "alert",
    "survey_delivery",
    "customer",
    "api_key",
  ];

  for (const table of tables) {
    try {
      // Enable RLS
      await db.execute(sql.raw(`ALTER TABLE IF EXISTS ${table} ENABLE ROW LEVEL SECURITY`));

      // Drop existing policy if exists (ignore errors)
      try {
        await db.execute(sql.raw(`DROP POLICY IF EXISTS ${table}_org_isolation ON ${table}`));
      } catch {
        // Policy may not exist, ignore
      }

      // Create policy (may fail if already exists from parallel test)
      try {
        await db.execute(
          sql.raw(`
            CREATE POLICY ${table}_org_isolation ON ${table}
            FOR ALL
            USING (org_id = current_setting('app.current_org_id', true))
            WITH CHECK (org_id = current_setting('app.current_org_id', true))
          `),
        );
      } catch {
        // Policy may already exist from parallel test, ignore
      }

      // Force RLS for table owners
      await db.execute(sql.raw(`ALTER TABLE IF EXISTS ${table} FORCE ROW LEVEL SECURITY`));
    } catch (error) {
      // Table may not exist yet on first run
      console.warn(`RLS setup warning for ${table}:`, (error as Error).message);
    }
  }

  console.log("RLS policies applied to test database");
}

beforeAll(async () => {
  // Apply RLS policies to test database
  await applyRlsPolicies();

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
export async function withTestOrg<T>(_orgId: string, fn: () => Promise<T>): Promise<T> {
  // This would set up the org context for database operations
  // In the actual implementation, this sets the PostgreSQL session variable
  return fn();
}

// Helper to create unique test identifiers
export function testId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
