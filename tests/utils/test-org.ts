import { sql } from "drizzle-orm";
import { db } from "@wp-nps/db";

/**
 * Test utilities for multi-tenant testing
 * Provides helpers for creating test organizations and setting up org context
 */

export interface TestOrg {
  id: string;
  name: string;
  slug: string;
}

/**
 * Creates a test organization in the database
 * Returns the org details for use in tests
 */
export async function createTestOrg(name: string): Promise<TestOrg> {
  const id = crypto.randomUUID();
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  await db.execute(sql`
    INSERT INTO organization (id, name, slug, created_at)
    VALUES (${id}, ${name}, ${slug}, NOW())
  `);

  return { id, name, slug };
}

/**
 * Creates a test user and adds them to the organization
 * Generates a unique email to avoid conflicts between tests
 */
export async function createTestUser(
  orgId: string,
  emailBase: string,
  role: "owner" | "admin" | "member" = "member",
) {
  const userId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  // Make email unique per invocation to avoid conflicts
  const emailParts = emailBase.split("@");
  const email = `${emailParts[0]}-${Date.now()}-${userId.slice(0, 8)}@${emailParts[1] ?? "test.com"}`;

  await db.execute(sql`
    INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
    VALUES (${userId}, ${email.split("@")[0]}, ${email}, true, NOW(), NOW())
  `);

  await db.execute(sql`
    INSERT INTO member (id, organization_id, user_id, role, created_at)
    VALUES (${memberId}, ${orgId}, ${userId}, ${role}, NOW())
  `);

  return { userId, email, role };
}

/**
 * Sets up org context for database operations
 * This simulates what the org-context middleware does
 * Using false for is_local parameter to make it session-scoped (not transaction-scoped)
 */
export async function setOrgContext(orgId: string): Promise<void> {
  await db.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, false)`);
}

/**
 * Clears org context
 */
export async function clearOrgContext(): Promise<void> {
  await db.execute(sql`SELECT set_config('app.current_org_id', '', false)`);
}

/**
 * Executes a function within an org context
 * Useful for testing org-scoped operations
 */
export async function withOrgContext<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
  await setOrgContext(orgId);
  try {
    return await fn();
  } finally {
    await clearOrgContext();
  }
}

/**
 * Cleans up test data for a specific org
 * Call this in afterEach to ensure test isolation
 */
export async function cleanupTestOrg(orgId: string): Promise<void> {
  await db.execute(sql`DELETE FROM alert WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM survey_response WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM survey_delivery WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM survey WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM customer WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM webhook_job WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM whatsapp_connection WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM org_metrics WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM org_usage WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM api_key WHERE org_id = ${orgId}`);
  await db.execute(sql`DELETE FROM onboarding_email_log WHERE org_id = ${orgId}`);

  // Delete member and invitation records
  await db.execute(sql`DELETE FROM invitation WHERE organization_id = ${orgId}`);
  await db.execute(sql`DELETE FROM member WHERE organization_id = ${orgId}`);

  // Finally delete the organization
  await db.execute(sql`DELETE FROM organization WHERE id = ${orgId}`);
}
