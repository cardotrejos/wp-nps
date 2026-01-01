import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { db, survey, surveyDelivery, surveyResponse, customer, orgMetrics } from "@wp-nps/db";
import { processResponse, categorizeNPS } from "@wp-nps/api/services/response-processor";
import { hashPhoneNumber } from "@wp-nps/api/utils/hash";
import { createTestOrg, cleanupTestOrg, setOrgContext } from "../utils/test-org";

describe("Response Processing", () => {
  let testOrg: { id: string; name: string; slug: string };
  let testSurvey: { id: string };
  let testDelivery: { id: string };
  const testPhone = "+5511999999999";
  const phoneHash = hashPhoneNumber(testPhone);

  beforeEach(async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testOrg = await createTestOrg(`Test Org ${uniqueId}`);
    await setOrgContext(testOrg.id);

    const [s] = await db
      .insert(survey)
      .values({
        orgId: testOrg.id,
        name: "Test NPS Survey",
        type: "nps",
        status: "active",
      })
      .returning();

    if (!s) throw new Error("Failed to create test survey");
    testSurvey = s;

    const [d] = await db
      .insert(surveyDelivery)
      .values({
        orgId: testOrg.id,
        surveyId: testSurvey.id,
        phoneNumber: testPhone,
        phoneNumberHash: phoneHash,
        status: "sent",
        metadata: { order_id: "ORD-123", customer_name: "Test Customer" },
      })
      .returning();

    if (!d) throw new Error("Failed to create test delivery");
    testDelivery = d;
  });

  afterEach(async () => {
    await cleanupTestOrg(testOrg.id);
  });

  describe("categorizeNPS", () => {
    it("categorizes score 9-10 as promoter", () => {
      expect(categorizeNPS(9)).toBe("promoter");
      expect(categorizeNPS(10)).toBe("promoter");
    });

    it("categorizes score 7-8 as passive", () => {
      expect(categorizeNPS(7)).toBe("passive");
      expect(categorizeNPS(8)).toBe("passive");
    });

    it("categorizes score 0-6 as detractor", () => {
      expect(categorizeNPS(0)).toBe("detractor");
      expect(categorizeNPS(6)).toBe("detractor");
    });
  });

  describe("processResponse", () => {
    it("categorizes NPS score correctly", async () => {
      const result = await processResponse({
        orgId: testOrg.id,
        customerPhone: testPhone,
        score: 9,
        feedback: "Great service!",
        messageId: "msg-1",
      });

      const response = await db.query.surveyResponse.findFirst({
        where: eq(surveyResponse.id, result.responseId),
      });

      expect(response).toBeDefined();
      expect(response?.category).toBe("promoter");
      expect(response?.score).toBe(9);
    });

    it("preserves metadata from delivery", async () => {
      const result = await processResponse({
        orgId: testOrg.id,
        customerPhone: testPhone,
        score: 7,
        feedback: null,
        messageId: "msg-2",
      });

      const response = await db.query.surveyResponse.findFirst({
        where: eq(surveyResponse.id, result.responseId),
      });

      expect(response?.metadata).toEqual({ order_id: "ORD-123", customer_name: "Test Customer" });
    });

    it("updates org_metrics in same transaction", async () => {
      const initialMetrics = await db.query.orgMetrics.findFirst({
        where: eq(orgMetrics.orgId, testOrg.id),
      });

      await processResponse({
        orgId: testOrg.id,
        customerPhone: testPhone,
        score: 10,
        feedback: null,
        messageId: "msg-3",
      });

      const updatedMetrics = await db.query.orgMetrics.findFirst({
        where: eq(orgMetrics.orgId, testOrg.id),
      });

      expect(updatedMetrics).toBeDefined();
      expect(updatedMetrics?.totalResponses).toBe((initialMetrics?.totalResponses ?? 0) + 1);
      expect(updatedMetrics?.promoterCount).toBe((initialMetrics?.promoterCount ?? 0) + 1);
    });

    it("updates delivery status to responded", async () => {
      await processResponse({
        orgId: testOrg.id,
        customerPhone: testPhone,
        score: 8,
        feedback: null,
        messageId: "msg-4",
      });

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, testDelivery.id),
      });

      expect(delivery?.status).toBe("responded");
      expect(delivery?.respondedAt).toBeDefined();
    });

    it("creates customer record if not exists", async () => {
      const newPhone = "+5511888888888";
      const newPhoneHash = hashPhoneNumber(newPhone);

      const [newDelivery] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: newPhone,
          phoneNumberHash: newPhoneHash,
          status: "sent",
        })
        .returning();

      if (!newDelivery) throw new Error("Failed to create new delivery");

      const result = await processResponse({
        orgId: testOrg.id,
        customerPhone: newPhone,
        score: 6,
        feedback: "Could be better",
        messageId: "msg-5",
      });

      expect(result.customerId).toBeDefined();

      const customerRecord = await db.query.customer.findFirst({
        where: and(eq(customer.orgId, testOrg.id), eq(customer.phoneNumberHash, newPhoneHash)),
      });

      expect(customerRecord).toBeDefined();
      expect(customerRecord?.phoneNumberHash).toBe(newPhoneHash);
    });

    it("links response to existing customer", async () => {
      const [existingCustomer] = await db
        .insert(customer)
        .values({
          orgId: testOrg.id,
          phoneNumberHash: phoneHash,
        })
        .returning();

      if (!existingCustomer) throw new Error("Failed to create customer");

      const result = await processResponse({
        orgId: testOrg.id,
        customerPhone: testPhone,
        score: 5,
        feedback: null,
        messageId: "msg-6",
      });

      expect(result.customerId).toBe(existingCustomer.id);
    });

    it("throws error when no matching delivery found", async () => {
      const unknownPhone = "+5511777777777";

      await expect(
        processResponse({
          orgId: testOrg.id,
          customerPhone: unknownPhone,
          score: 8,
          feedback: null,
          messageId: "msg-7",
        }),
      ).rejects.toThrow("No matching delivery found for response");
    });

    it("excludes test responses from metrics", async () => {
      const testPhoneForTest = "+5511666666666";
      const testPhoneHashForTest = hashPhoneNumber(testPhoneForTest);

      const [testDeliveryForTest] = await db
        .insert(surveyDelivery)
        .values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: testPhoneForTest,
          phoneNumberHash: testPhoneHashForTest,
          status: "sent",
          isTest: true,
        })
        .returning();

      if (!testDeliveryForTest) throw new Error("Failed to create test delivery");

      const initialMetrics = await db.query.orgMetrics.findFirst({
        where: eq(orgMetrics.orgId, testOrg.id),
      });
      const initialCount = initialMetrics?.totalResponses ?? 0;

      await processResponse({
        orgId: testOrg.id,
        customerPhone: testPhoneForTest,
        score: 10,
        feedback: "Test response",
        messageId: "msg-test",
      });

      const finalMetrics = await db.query.orgMetrics.findFirst({
        where: eq(orgMetrics.orgId, testOrg.id),
      });

      expect(finalMetrics?.totalResponses ?? 0).toBe(initialCount);
    });
  });
});
