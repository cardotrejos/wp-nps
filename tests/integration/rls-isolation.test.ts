import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { createTestOrg, cleanupTestOrg, setOrgContext, clearOrgContext } from "../utils/test-org";

/**
 * Multi-Tenant Isolation Tests
 *
 * These tests verify two critical aspects of multi-tenancy:
 *
 * 1. RLS Policy Configuration - Verifies that RLS policies are enabled
 *    and correctly configured on all FlowPulse tables
 *
 * 2. Application-Level Isolation - Tests the Drizzle ORM-based filtering
 *    that provides multi-tenant isolation at the application level
 *
 * NOTE: PostgreSQL superuser (used in tests) bypasses RLS policies.
 * In production, the application connects as a restricted user where
 * RLS policies are enforced. We test RLS configuration correctness here.
 */

describe("Multi-Tenant Isolation", () => {
  let org1: { id: string; name: string; slug: string };
  let org2: { id: string; name: string; slug: string };

  beforeEach(async () => {
    await clearOrgContext();
    const testId = crypto.randomUUID().slice(0, 8);
    org1 = await createTestOrg(`RLS Test Org1 ${testId}`);
    org2 = await createTestOrg(`RLS Test Org2 ${testId}`);
  });

  afterEach(async () => {
    await clearOrgContext();
    await cleanupTestOrg(org1.id);
    await cleanupTestOrg(org2.id);
  });

  describe("RLS Policy Configuration", () => {
    const flowpulseTables = [
      "survey",
      "survey_response",
      "alert",
      "whatsapp_connection",
      "webhook_job",
      "org_metrics",
      "org_usage",
      "survey_delivery",
      "customer",
      "api_key",
    ];

    it("should have RLS enabled on all FlowPulse tables", async () => {
      for (const tableName of flowpulseTables) {
        const result = await db.execute(sql`
          SELECT relrowsecurity
          FROM pg_class
          WHERE relname = ${tableName}
        `);

        const row = result.rows[0] as { relrowsecurity: boolean } | undefined;
        expect(row?.relrowsecurity, `RLS should be enabled on ${tableName}`).toBe(true);
      }
    });

    it("should have org_id isolation policies on all FlowPulse tables", async () => {
      for (const tableName of flowpulseTables) {
        const result = await db.execute(sql`
          SELECT polname, pg_get_expr(polqual, polrelid) as policy_expr
          FROM pg_policy
          WHERE polrelid = ${tableName}::regclass
        `);

        expect(
          result.rows.length,
          `${tableName} should have at least one RLS policy`,
        ).toBeGreaterThan(0);

        // Verify at least one policy references app.current_org_id
        const hasOrgPolicy = result.rows.some((row) => {
          const policy = row as { policy_expr: string };
          return (
            policy.policy_expr?.includes("app.current_org_id") ||
            policy.policy_expr?.includes("current_setting")
          );
        });

        expect(hasOrgPolicy, `${tableName} should have a policy using app.current_org_id`).toBe(
          true,
        );
      }
    });
  });

  describe("Application-Level Isolation with Org Context", () => {
    it("should set and retrieve org context correctly", async () => {
      await setOrgContext(org1.id);

      const result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe(org1.id);
    });

    it("should switch org context between organizations", async () => {
      // Set to org1
      await setOrgContext(org1.id);
      let result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      let row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe(org1.id);

      // Switch to org2
      await setOrgContext(org2.id);
      result = await db.execute(sql`SELECT current_setting('app.current_org_id', true) as org_id`);
      row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe(org2.id);
    });

    it("should clear org context", async () => {
      await setOrgContext(org1.id);
      await clearOrgContext();

      const result = await db.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`,
      );
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe("");
    });
  });

  describe("Application-Level Data Filtering", () => {
    it("should create surveys with correct org_id", async () => {
      const surveyId = crypto.randomUUID();
      await setOrgContext(org1.id);

      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${surveyId}, ${org1.id}, 'Test Survey', 'nps', 'draft', NOW(), NOW())
      `);

      // Verify the survey was created with correct org_id
      const result = await db.execute(sql`SELECT org_id FROM survey WHERE id = ${surveyId}`);
      const row = result.rows[0] as { org_id: string };
      expect(row.org_id).toBe(org1.id);
    });

    it("should filter surveys by org_id in application queries", async () => {
      // Create surveys for both orgs
      const survey1Id = crypto.randomUUID();
      const survey2Id = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${survey1Id}, ${org1.id}, 'Org1 Survey', 'nps', 'draft', NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${survey2Id}, ${org2.id}, 'Org2 Survey', 'nps', 'draft', NOW(), NOW())
      `);

      // Query with org1 filter - should only see org1's survey
      const org1Surveys = await db.execute(sql`SELECT id FROM survey WHERE org_id = ${org1.id}`);
      expect(org1Surveys.rows).toHaveLength(1);
      expect((org1Surveys.rows[0] as { id: string }).id).toBe(survey1Id);

      // Query with org2 filter - should only see org2's survey
      const org2Surveys = await db.execute(sql`SELECT id FROM survey WHERE org_id = ${org2.id}`);
      expect(org2Surveys.rows).toHaveLength(1);
      expect((org2Surveys.rows[0] as { id: string }).id).toBe(survey2Id);
    });

    it("should isolate whatsapp connections via org_id filtering", async () => {
      const conn1Id = crypto.randomUUID();
      const conn2Id = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO whatsapp_connection (id, org_id, status, created_at, updated_at)
        VALUES (${conn1Id}, ${org1.id}, 'connected', NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO whatsapp_connection (id, org_id, status, created_at, updated_at)
        VALUES (${conn2Id}, ${org2.id}, 'pending', NOW(), NOW())
      `);

      // Verify isolation
      const org1Conns = await db.execute(
        sql`SELECT id FROM whatsapp_connection WHERE org_id = ${org1.id}`,
      );
      expect(org1Conns.rows).toHaveLength(1);
      expect((org1Conns.rows[0] as { id: string }).id).toBe(conn1Id);
    });

    it("should isolate survey responses via org_id filtering", async () => {
      // Create surveys first
      const survey1Id = crypto.randomUUID();
      const survey2Id = crypto.randomUUID();
      const response1Id = crypto.randomUUID();
      const response2Id = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${survey1Id}, ${org1.id}, 'Survey 1', 'nps', 'active', NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${survey2Id}, ${org2.id}, 'Survey 2', 'nps', 'active', NOW(), NOW())
      `);

      // Create responses
      await db.execute(sql`
        INSERT INTO survey_response (id, org_id, survey_id, customer_phone, score, created_at)
        VALUES (${response1Id}, ${org1.id}, ${survey1Id}, '+111', 9, NOW())
      `);
      await db.execute(sql`
        INSERT INTO survey_response (id, org_id, survey_id, customer_phone, score, created_at)
        VALUES (${response2Id}, ${org2.id}, ${survey2Id}, '+222', 7, NOW())
      `);

      // Verify isolation
      const org1Responses = await db.execute(
        sql`SELECT id FROM survey_response WHERE org_id = ${org1.id}`,
      );
      expect(org1Responses.rows).toHaveLength(1);
      expect((org1Responses.rows[0] as { id: string }).id).toBe(response1Id);
    });

    it("should isolate alerts via org_id filtering", async () => {
      // Create full chain for both orgs
      const survey1Id = crypto.randomUUID();
      const response1Id = crypto.randomUUID();
      const alert1Id = crypto.randomUUID();

      const survey2Id = crypto.randomUUID();
      const response2Id = crypto.randomUUID();
      const alert2Id = crypto.randomUUID();

      // Org1 chain
      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${survey1Id}, ${org1.id}, 'Survey', 'nps', 'active', NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO survey_response (id, org_id, survey_id, customer_phone, score, category, created_at)
        VALUES (${response1Id}, ${org1.id}, ${survey1Id}, '+111', 3, 'detractor', NOW())
      `);
      await db.execute(sql`
        INSERT INTO alert (id, org_id, response_id, type, status, created_at, updated_at)
        VALUES (${alert1Id}, ${org1.id}, ${response1Id}, 'detractor', 'active', NOW(), NOW())
      `);

      // Org2 chain
      await db.execute(sql`
        INSERT INTO survey (id, org_id, name, type, status, created_at, updated_at)
        VALUES (${survey2Id}, ${org2.id}, 'Survey', 'nps', 'active', NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO survey_response (id, org_id, survey_id, customer_phone, score, category, created_at)
        VALUES (${response2Id}, ${org2.id}, ${survey2Id}, '+222', 2, 'detractor', NOW())
      `);
      await db.execute(sql`
        INSERT INTO alert (id, org_id, response_id, type, status, created_at, updated_at)
        VALUES (${alert2Id}, ${org2.id}, ${response2Id}, 'detractor', 'active', NOW(), NOW())
      `);

      // Verify isolation
      const org1Alerts = await db.execute(sql`SELECT id FROM alert WHERE org_id = ${org1.id}`);
      expect(org1Alerts.rows).toHaveLength(1);
      expect((org1Alerts.rows[0] as { id: string }).id).toBe(alert1Id);
    });

    it("should isolate org metrics via org_id filtering", async () => {
      const metric1Id = crypto.randomUUID();
      const metric2Id = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO org_metrics (id, org_id, metric_date, nps_score, total_responses, created_at, updated_at)
        VALUES (${metric1Id}, ${org1.id}, NOW(), 45.5, 100, NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO org_metrics (id, org_id, metric_date, nps_score, total_responses, created_at, updated_at)
        VALUES (${metric2Id}, ${org2.id}, NOW(), 32.0, 50, NOW(), NOW())
      `);

      // Verify isolation
      const org1Metrics = await db.execute(
        sql`SELECT id FROM org_metrics WHERE org_id = ${org1.id}`,
      );
      expect(org1Metrics.rows).toHaveLength(1);
      expect((org1Metrics.rows[0] as { id: string }).id).toBe(metric1Id);
    });

    it("should isolate org usage via org_id filtering", async () => {
      const usage1Id = crypto.randomUUID();
      const usage2Id = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO org_usage (id, org_id, period_start, period_end, surveys_sent, created_at, updated_at)
        VALUES (${usage1Id}, ${org1.id}, NOW(), NOW() + interval '30 days', 100, NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO org_usage (id, org_id, period_start, period_end, surveys_sent, created_at, updated_at)
        VALUES (${usage2Id}, ${org2.id}, NOW(), NOW() + interval '30 days', 200, NOW(), NOW())
      `);

      // Verify isolation
      const org1Usage = await db.execute(sql`SELECT id FROM org_usage WHERE org_id = ${org1.id}`);
      expect(org1Usage.rows).toHaveLength(1);
      expect((org1Usage.rows[0] as { id: string }).id).toBe(usage1Id);
    });

    it("should isolate webhook jobs via org_id filtering", async () => {
      const job1Id = crypto.randomUUID();
      const job2Id = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO webhook_job (id, org_id, idempotency_key, source, event_type, status, payload, created_at, updated_at)
        VALUES (${job1Id}, ${org1.id}, ${`key-${job1Id}`}, 'kapso', 'survey.response', 'pending', '{}', NOW(), NOW())
      `);
      await db.execute(sql`
        INSERT INTO webhook_job (id, org_id, idempotency_key, source, event_type, status, payload, created_at, updated_at)
        VALUES (${job2Id}, ${org2.id}, ${`key-${job2Id}`}, 'kapso', 'survey.response', 'completed', '{}', NOW(), NOW())
      `);

      // Verify isolation
      const org1Jobs = await db.execute(sql`SELECT id FROM webhook_job WHERE org_id = ${org1.id}`);
      expect(org1Jobs.rows).toHaveLength(1);
      expect((org1Jobs.rows[0] as { id: string }).id).toBe(job1Id);
    });
  });
});
