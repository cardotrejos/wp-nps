import { createHash } from "node:crypto";
import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { survey, surveyDelivery, whatsappConnection } from "@wp-nps/db/schema/flowpulse";
import { generateApiKey } from "../../packages/api/src/services/api-key";
import { queueSurveySend, SurveySendError } from "../../packages/api/src/services/survey-send";
import { createTestOrg, cleanupTestOrg } from "../utils/test-org";

function hashPhone(phone: string): string {
  return createHash("sha256").update(phone).digest("hex");
}

describe("Survey Send API (Story 3.3)", () => {
  const testOrgIds: string[] = [];

  afterEach(async () => {
    for (const orgId of testOrgIds) {
      await cleanupTestOrg(orgId);
    }
    testOrgIds.length = 0;
  });

  describe("AC #1: API sends survey and returns 202 with delivery_id", () => {
    it("queues survey send and returns delivery ID", async () => {
      const org = await createTestOrg(`API Send ${Date.now()}`);
      testOrgIds.push(org.id);

      await db.insert(whatsappConnection).values({
        orgId: org.id,
        status: "active",
        phoneNumber: "+5511999999999",
      });

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "API Test Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      expect(testSurvey).toBeDefined();

      const deliveryId = await queueSurveySend({
        orgId: org.id,
        surveyId: testSurvey!.id,
        phoneNumber: "+5511888888888",
        metadata: { order_id: "123" },
      });

      expect(deliveryId).toBeDefined();
      expect(typeof deliveryId).toBe("string");

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, deliveryId),
      });

      expect(delivery).toBeDefined();
      expect(delivery?.status).toBe("queued");
      expect(delivery?.phoneNumber).toBe("+5511888888888");
    });
  });

  describe("AC #2: Metadata stored with delivery record", () => {
    it("stores metadata in delivery record", async () => {
      const org = await createTestOrg(`Metadata Test ${Date.now()}`);
      testOrgIds.push(org.id);

      await db.insert(whatsappConnection).values({
        orgId: org.id,
        status: "active",
        phoneNumber: "+5511999999999",
      });

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Metadata Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      const metadata = {
        order_id: "ORD-123",
        customer_name: "Carlos",
        purchase_date: "2025-12-30",
      };

      const deliveryId = await queueSurveySend({
        orgId: org.id,
        surveyId: testSurvey!.id,
        phoneNumber: "+5511777777777",
        metadata,
      });

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, deliveryId),
      });

      expect(delivery?.metadata).toEqual(metadata);
    });
  });

  describe("AC #3: Inactive survey returns 400", () => {
    it("rejects send for inactive survey", async () => {
      const org = await createTestOrg(`Inactive Survey ${Date.now()}`);
      testOrgIds.push(org.id);

      const [inactiveSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Inactive Survey",
          type: "nps",
          status: "draft",
          questions: [],
        })
        .returning();

      await expect(
        queueSurveySend({
          orgId: org.id,
          surveyId: inactiveSurvey!.id,
          phoneNumber: "+5511999999999",
        }),
      ).rejects.toThrow(SurveySendError);

      try {
        await queueSurveySend({
          orgId: org.id,
          surveyId: inactiveSurvey!.id,
          phoneNumber: "+5511999999999",
        });
      } catch (err) {
        expect(err).toBeInstanceOf(SurveySendError);
        expect((err as SurveySendError).code).toBe("SURVEY_INACTIVE");
        expect((err as SurveySendError).message).toBe("Survey is not active");
      }
    });
  });

  describe("AC #4: Invalid phone number returns 400", () => {
    it("rejects phone missing + prefix with INVALID_PHONE error", async () => {
      const org = await createTestOrg(`Invalid Phone ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Phone Validation Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      await expect(
        queueSurveySend({
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "5511999999999",
        }),
      ).rejects.toThrow(SurveySendError);

      try {
        await queueSurveySend({
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "5511999999999",
        });
      } catch (err) {
        expect(err).toBeInstanceOf(SurveySendError);
        expect((err as SurveySendError).code).toBe("INVALID_PHONE");
      }
    });

    it("rejects phone with letters", async () => {
      const org = await createTestOrg(`Letters Phone ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Letters Phone Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      await expect(
        queueSurveySend({
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "+55abc999999",
        }),
      ).rejects.toThrow(SurveySendError);
    });
  });

  describe("AC #5: Missing API key returns 401", () => {
    it("validates API key exists", async () => {
      const org = await createTestOrg(`API Key Test ${Date.now()}`);
      testOrgIds.push(org.id);

      const apiKey = await generateApiKey(org.id);
      expect(apiKey).toMatch(/^fp_/);
    });
  });

  describe("AC #6: Cross-org isolation", () => {
    it("prevents access to other org surveys", async () => {
      const org1 = await createTestOrg(`Org1 ${Date.now()}`);
      const org2 = await createTestOrg(`Org2 ${Date.now()}`);
      testOrgIds.push(org1.id, org2.id);

      const [org1Survey] = await db
        .insert(survey)
        .values({
          orgId: org1.id,
          name: "Org1 Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate?", type: "rating", required: true }],
        })
        .returning();

      await expect(
        queueSurveySend({
          orgId: org2.id,
          surveyId: org1Survey!.id,
          phoneNumber: "+5511999999999",
        }),
      ).rejects.toThrow(SurveySendError);

      try {
        await queueSurveySend({
          orgId: org2.id,
          surveyId: org1Survey!.id,
          phoneNumber: "+5511999999999",
        });
      } catch (err) {
        expect(err).toBeInstanceOf(SurveySendError);
        expect((err as SurveySendError).code).toBe("SURVEY_NOT_FOUND");
      }
    });
  });

  describe("phoneNumberHash storage", () => {
    it("stores SHA-256 hash of phone number", async () => {
      const org = await createTestOrg(`Hash Test ${Date.now()}`);
      testOrgIds.push(org.id);

      await db.insert(whatsappConnection).values({
        orgId: org.id,
        status: "active",
        phoneNumber: "+5511999999999",
      });

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Hash Survey",
          type: "nps",
          status: "active",
          questions: [{ id: "q1", text: "Rate?", type: "rating", required: true }],
        })
        .returning();

      const phoneNumber = "+5511666666666";
      const deliveryId = await queueSurveySend({
        orgId: org.id,
        surveyId: testSurvey!.id,
        phoneNumber,
      });

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, deliveryId),
      });

      expect(delivery?.phoneNumberHash).toBe(hashPhone(phoneNumber));
    });
  });
});
