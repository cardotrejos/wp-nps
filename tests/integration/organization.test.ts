import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@wp-nps/db";
import {
  createTestOrg,
  createTestUser,
  cleanupTestOrg,
  setOrgContext,
  clearOrgContext,
  withOrgContext,
} from "../utils/test-org";

/**
 * Organization and Multi-Tenancy Integration Tests
 *
 * Tests for Better Auth organization plugin integration and
 * multi-tenant data isolation.
 */

describe("Organization Management", () => {
  let testOrg1: { id: string; name: string; slug: string };
  let testOrg2: { id: string; name: string; slug: string };

  beforeEach(async () => {
    // Clear any existing org context
    await clearOrgContext();
  });

  afterEach(async () => {
    // Clean up test data
    if (testOrg1) {
      await cleanupTestOrg(testOrg1.id);
    }
    if (testOrg2) {
      await cleanupTestOrg(testOrg2.id);
    }
    await clearOrgContext();
  });

  describe("Organization Creation", () => {
    it("should create an organization with correct properties", async () => {
      testOrg1 = await createTestOrg("Acme Corp");

      expect(testOrg1.id).toBeDefined();
      expect(testOrg1.name).toBe("Acme Corp");
      expect(testOrg1.slug).toBe("acme-corp");

      // Verify in database
      const result = await db.execute(sql`SELECT * FROM organization WHERE id = ${testOrg1.id}`);
      expect(result.rows).toHaveLength(1);
      const org = result.rows[0] as { id: string; name: string; slug: string };
      expect(org.name).toBe("Acme Corp");
    });

    it("should create multiple organizations with unique IDs", async () => {
      testOrg1 = await createTestOrg("Acme Corp");
      testOrg2 = await createTestOrg("Beta Inc");

      expect(testOrg1.id).not.toBe(testOrg2.id);
      expect(testOrg1.slug).not.toBe(testOrg2.slug);
    });
  });

  describe("Organization Membership", () => {
    it("should add a user to an organization with a role", async () => {
      testOrg1 = await createTestOrg("Acme Corp");
      const user = await createTestUser(testOrg1.id, "owner@acme.com", "owner");

      expect(user.userId).toBeDefined();
      expect(user.role).toBe("owner");

      // Verify membership in database
      const result = await db.execute(
        sql`SELECT * FROM member WHERE user_id = ${user.userId} AND organization_id = ${testOrg1.id}`,
      );
      expect(result.rows).toHaveLength(1);
      const member = result.rows[0] as { role: string };
      expect(member.role).toBe("owner");
    });

    it("should support multiple users in an organization", async () => {
      testOrg1 = await createTestOrg("Acme Corp");
      await createTestUser(testOrg1.id, "owner@acme.com", "owner");
      await createTestUser(testOrg1.id, "admin@acme.com", "admin");
      await createTestUser(testOrg1.id, "member@acme.com", "member");

      const result = await db.execute(
        sql`SELECT COUNT(*)::int as count FROM member WHERE organization_id = ${testOrg1.id}`,
      );
      const row = result.rows[0] as { count: number };
      expect(row.count).toBe(3);
    });
  });

  describe("Org Context Setting", () => {
    it("should set org context for database session", async () => {
      testOrg1 = await createTestOrg("Acme Corp");

      await setOrgContext(testOrg1.id);

      // Verify context is set
      const result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe(testOrg1.id);
    });

    it("should clear org context", async () => {
      testOrg1 = await createTestOrg("Acme Corp");
      await setOrgContext(testOrg1.id);
      await clearOrgContext();

      const result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe("");
    });

    it("should execute function within org context", async () => {
      testOrg1 = await createTestOrg("Acme Corp");

      const contextOrgId = await withOrgContext(testOrg1.id, async () => {
        const result = await db.execute(
          sql`SELECT current_setting('app.current_org_id', true) as org_id`,
        );
        const row = result.rows[0] as { org_id: string };
        return row.org_id;
      });

      expect(contextOrgId).toBe(testOrg1.id);

      // Verify context is cleared after
      const result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe("");
    });
  });
});
