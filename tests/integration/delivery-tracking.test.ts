import { describe, it, expect, afterEach } from "vitest";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, survey, surveyDelivery } from "@wp-nps/db";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";
import { maskPhoneNumber } from "../../packages/api/src/utils/phone-mask";

describe("Delivery Status Tracking (Story 3.5)", () => {
  let testOrgIds: string[] = [];

  afterEach(async () => {
    for (const orgId of testOrgIds) {
      await db.delete(surveyDelivery).where(eq(surveyDelivery.orgId, orgId)).catch(() => {});
      await cleanupTestOrg(orgId).catch(() => {});
    }
    testOrgIds = [];
    await clearOrgContext();
  });

  describe("AC #1, #2: Delivery list with status and metadata", () => {
    it("returns delivery records with status and metadata", async () => {
      const org = await createTestOrg(`DeliveryTest-${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Test Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate?", type: "rating", required: true }],
        })
        .returning();

      await db.insert(surveyDelivery).values([
        {
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "+5511999999999",
          phoneNumberHash: "hash1",
          status: "sent",
          metadata: { customer_name: "Carlos" },
        },
        {
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "+5511888888888",
          phoneNumberHash: "hash2",
          status: "failed",
          errorMessage: "Rate limited",
        },
      ]);

      const deliveries = await db.query.surveyDelivery.findMany({
        where: and(eq(surveyDelivery.orgId, org.id), eq(surveyDelivery.surveyId, testSurvey!.id)),
        orderBy: [desc(surveyDelivery.createdAt)],
      });

      expect(deliveries).toHaveLength(2);

      const sent = deliveries.find((d) => d.status === "sent");
      expect(sent).toBeDefined();
      expect(sent?.metadata).toEqual({ customer_name: "Carlos" });

      const failed = deliveries.find((d) => d.status === "failed");
      expect(failed).toBeDefined();
      expect(failed?.errorMessage).toBe("Rate limited");
    });
  });

  describe("AC #3: Pagination", () => {
    it("supports paginated delivery queries", async () => {
      const org = await createTestOrg(`PaginationTest-${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Pagination Survey",
          type: "nps",
          status: "active",
          questions: [],
        })
        .returning();

      const deliveryValues = [];
      for (let i = 0; i < 25; i++) {
        deliveryValues.push({
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: `+551199999${String(i).padStart(4, "0")}`,
          phoneNumberHash: `hash${i}`,
          status: "sent",
        });
      }
      await db.insert(surveyDelivery).values(deliveryValues);

      const page1 = await db.query.surveyDelivery.findMany({
        where: and(eq(surveyDelivery.orgId, org.id), eq(surveyDelivery.surveyId, testSurvey!.id)),
        orderBy: [desc(surveyDelivery.createdAt)],
        limit: 20,
        offset: 0,
      });

      expect(page1).toHaveLength(20);

      const page2 = await db.query.surveyDelivery.findMany({
        where: and(eq(surveyDelivery.orgId, org.id), eq(surveyDelivery.surveyId, testSurvey!.id)),
        orderBy: [desc(surveyDelivery.createdAt)],
        limit: 20,
        offset: 20,
      });

      expect(page2).toHaveLength(5);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveyDelivery)
        .where(and(eq(surveyDelivery.orgId, org.id), eq(surveyDelivery.surveyId, testSurvey!.id)));

      expect(totalResult[0]?.count).toBe(25);
    });

    it("filters by status", async () => {
      const org = await createTestOrg(`StatusFilterTest-${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({ orgId: org.id, name: "Filter Survey", type: "nps", status: "active", questions: [] })
        .returning();

      await db.insert(surveyDelivery).values([
        { orgId: org.id, surveyId: testSurvey!.id, phoneNumber: "+5511000000001", phoneNumberHash: "h1", status: "sent" },
        { orgId: org.id, surveyId: testSurvey!.id, phoneNumber: "+5511000000002", phoneNumberHash: "h2", status: "failed" },
        { orgId: org.id, surveyId: testSurvey!.id, phoneNumber: "+5511000000003", phoneNumberHash: "h3", status: "sent" },
        { orgId: org.id, surveyId: testSurvey!.id, phoneNumber: "+5511000000004", phoneNumberHash: "h4", status: "delivered" },
      ]);

      const failedOnly = await db.query.surveyDelivery.findMany({
        where: and(
          eq(surveyDelivery.orgId, org.id),
          eq(surveyDelivery.surveyId, testSurvey!.id),
          eq(surveyDelivery.status, "failed"),
        ),
      });

      expect(failedOnly).toHaveLength(1);
      expect(failedOnly[0]?.status).toBe("failed");
    });
  });

  describe("AC #4: Phone number masking", () => {
    it("masks Brazilian phone number correctly", () => {
      expect(maskPhoneNumber("+5511999999999")).toBe("+55*******9999");
    });

    it("masks US phone number correctly", () => {
      expect(maskPhoneNumber("+14155551234")).toBe("+14*****1234");
    });

    it("masks UK phone number correctly", () => {
      expect(maskPhoneNumber("+447911123456")).toBe("+44******3456");
    });

    it("handles short/invalid phone numbers gracefully", () => {
      expect(maskPhoneNumber("")).toBe("****");
      expect(maskPhoneNumber("+12345")).toBe("****");
    });
  });

  describe("AC #5: Delivery detail with full metadata", () => {
    it("returns delivery by ID with all fields", async () => {
      const org = await createTestOrg(`DetailTest-${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({ orgId: org.id, name: "Detail Survey", type: "nps", status: "active", questions: [] })
        .returning();

      const deliveredAt = new Date();
      const [delivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "+5511777777777",
          phoneNumberHash: "hashDetail",
          status: "delivered",
          metadata: { customer_name: "Maria", order_id: "12345" },
          kapsoDeliveryId: "kapso-123",
          deliveredAt,
        })
        .returning();

      const found = await db.query.surveyDelivery.findFirst({
        where: and(eq(surveyDelivery.id, delivery!.id), eq(surveyDelivery.orgId, org.id)),
      });

      expect(found).toBeDefined();
      expect(found?.status).toBe("delivered");
      expect(found?.metadata).toEqual({ customer_name: "Maria", order_id: "12345" });
      expect(found?.kapsoDeliveryId).toBe("kapso-123");
      expect(found?.deliveredAt).toBeDefined();
    });
  });

  describe("Multi-tenant isolation", () => {
    it("org1 cannot access org2 deliveries", async () => {
      const org1 = await createTestOrg(`IsolationOrg1-${Date.now()}`);
      const org2 = await createTestOrg(`IsolationOrg2-${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      await db
        .insert(survey)
        .values({ orgId: org1.id, name: "Org1 Survey", type: "nps", status: "active", questions: [] });

      const [survey2] = await db
        .insert(survey)
        .values({ orgId: org2.id, name: "Org2 Survey", type: "nps", status: "active", questions: [] })
        .returning();

      const [delivery2] = await db
        .insert(surveyDelivery)
        .values({
          orgId: org2.id,
          surveyId: survey2!.id,
          phoneNumber: "+5511222222222",
          phoneNumberHash: "hashIsolation",
          status: "sent",
        })
        .returning();

      const org1Deliveries = await db.query.surveyDelivery.findMany({
        where: eq(surveyDelivery.orgId, org1.id),
      });
      expect(org1Deliveries).toHaveLength(0);

      const crossOrgAttempt = await db.query.surveyDelivery.findFirst({
        where: and(eq(surveyDelivery.id, delivery2!.id), eq(surveyDelivery.orgId, org1.id)),
      });
      expect(crossOrgAttempt).toBeUndefined();
    });

    it("each org only sees their own survey deliveries", async () => {
      const org1 = await createTestOrg(`MultiOrg1-${Date.now()}`);
      const org2 = await createTestOrg(`MultiOrg2-${Date.now() + 1}`);
      testOrgIds.push(org1.id, org2.id);

      const [survey1] = await db
        .insert(survey)
        .values({ orgId: org1.id, name: "Org1 Survey", type: "nps", status: "active", questions: [] })
        .returning();

      const [survey2] = await db
        .insert(survey)
        .values({ orgId: org2.id, name: "Org2 Survey", type: "nps", status: "active", questions: [] })
        .returning();

      await db.insert(surveyDelivery).values([
        { orgId: org1.id, surveyId: survey1!.id, phoneNumber: "+5511111111111", phoneNumberHash: "h1", status: "sent" },
        { orgId: org2.id, surveyId: survey2!.id, phoneNumber: "+5522222222222", phoneNumberHash: "h2", status: "sent" },
      ]);

      const org1Count = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveyDelivery)
        .where(eq(surveyDelivery.orgId, org1.id));

      const org2Count = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveyDelivery)
        .where(eq(surveyDelivery.orgId, org2.id));

      expect(org1Count[0]?.count).toBe(1);
      expect(org2Count[0]?.count).toBe(1);
    });
  });
});
