import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

/**
 * Org Context Middleware Integration Tests
 *
 * Tests for the org context middleware that enforces multi-tenancy
 * by setting PostgreSQL session variables for RLS.
 *
 * NOTE: These tests verify the middleware pattern works correctly.
 * The actual middleware is tested here by simulating its behavior
 * since oRPC procedure testing requires the full server context.
 */

describe("Org Context Middleware", () => {
  let testOrg: { id: string; name: string; slug: string };

  beforeEach(async () => {
    await clearOrgContext();
    testOrg = await createTestOrg("Test Org");
  });

  afterEach(async () => {
    await clearOrgContext();
    await cleanupTestOrg(testOrg.id);
  });

  describe("Transaction-scoped context", () => {
    it("should set org context within a transaction", async () => {
      // Simulate what the middleware does: set context within transaction
      const result = await db.transaction(async (tx) => {
        // Set context for RLS (is_local=true means transaction-scoped)
        await tx.execute(sql`SELECT set_config('app.current_org_id', ${testOrg.id}, true)`);

        // Verify context is set within transaction
        const contextResult = await tx.execute(
          sql`SELECT current_setting('app.current_org_id', true) as org_id`,
        );
        const row = contextResult.rows[0] as { org_id: string };
        return row.org_id;
      });

      expect(result).toBe(testOrg.id);
    });

    it("should isolate context between transactions", async () => {
      const org2 = await createTestOrg("Other Org");

      try {
        // Transaction 1: Set to testOrg
        await db.transaction(async (tx) => {
          await tx.execute(sql`SELECT set_config('app.current_org_id', ${testOrg.id}, true)`);
        });

        // Transaction 2: Should not see previous context
        const result = await db.transaction(async (tx) => {
          const contextResult = await tx.execute(
            sql`SELECT current_setting('app.current_org_id', true) as org_id`,
          );
          const row = contextResult.rows[0] as { org_id: string };
          return row.org_id;
        });

        // Context should be empty in new transaction
        expect(result).toBe("");
      } finally {
        await cleanupTestOrg(org2.id);
      }
    });

    it("should allow inserting data with correct org_id in transaction", async () => {
      const surveyId = crypto.randomUUID();

      await db.transaction(async (tx) => {
        // Set org context
        await tx.execute(sql`SELECT set_config('app.current_org_id', ${testOrg.id}, true)`);

        // Insert survey with org context
        await tx.execute(sql`
          INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
          VALUES (${surveyId}, ${testOrg.id}, 'Test Survey', 'nps', 'draft', NOW(), NOW())
        `);
      });

      // Verify survey was created with correct org_id
      const result = await db.execute(sql`SELECT org_id FROM survey WHERE id = ${surveyId}`);
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe(testOrg.id);

      // Cleanup
      await db.execute(sql`DELETE FROM survey WHERE id = ${surveyId}`);
    });
  });

  describe("Error scenarios", () => {
    it("should handle empty org context gracefully", async () => {
      // current_setting with missing_ok=true returns empty string for unset variable
      const result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe("");
    });

    it("should allow clearing context within transaction", async () => {
      const result = await db.transaction(async (tx) => {
        // Set context
        await tx.execute(sql`SELECT set_config('app.current_org_id', ${testOrg.id}, true)`);

        // Clear context
        await tx.execute(sql`SELECT set_config('app.current_org_id', '', true)`);

        // Verify cleared
        const contextResult = await tx.execute(
          sql`SELECT current_setting('app.current_org_id', true) as org_id`,
        );
        const row = contextResult.rows[0] as { org_id: string };
        return row.org_id;
      });

      expect(result).toBe("");
    });
  });

  describe("withOrgFilter helper pattern", () => {
    it("should correctly add orgId to data objects", () => {
      // Test the withOrgFilter pattern used in the middleware
      function withOrgFilter<T extends { orgId: string }>(
        orgId: string,
        data: Omit<T, "orgId">,
      ): T {
        return { ...data, orgId } as T;
      }

      const surveyData = { name: "Test", type: "nps" };
      const result = withOrgFilter<{
        orgId: string;
        name: string;
        type: string;
      }>(testOrg.id, surveyData);

      expect(result.orgId).toBe(testOrg.id);
      expect(result.name).toBe("Test");
      expect(result.type).toBe("nps");
    });
  });
});
