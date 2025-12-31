import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { survey, surveyDelivery, webhookJob } from "@wp-nps/db/schema/flowpulse";
import { queueSurveySend, SurveySendError } from "../../packages/api/src/services/survey-send";
import { createTestOrg, cleanupTestOrg } from "../utils/test-org";

describe("Manual Survey Send (Story 3.10)", () => {
  const testOrgIds: string[] = [];

  afterEach(async () => {
    for (const orgId of testOrgIds) {
      await cleanupTestOrg(orgId);
    }
    testOrgIds.length = 0;
  });

  describe("AC #1, #2: Valid phone queues delivery", () => {
    it("creates delivery and queues job for valid phone", async () => {
      const org = await createTestOrg(`Manual Send ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Manual Test Survey",
          type: "nps",
          status: "active",
          triggerType: "manual",
          questions: [{ id: "q1", text: "How likely to recommend?", type: "rating", required: true }],
        })
        .returning();

      expect(testSurvey).toBeDefined();

      const deliveryId = await queueSurveySend({
        orgId: org.id,
        surveyId: testSurvey!.id,
        phoneNumber: "+5511999999999",
        metadata: { order_id: "ORD-123", customer_name: "Carlos" },
      });

      expect(deliveryId).toBeDefined();
      expect(typeof deliveryId).toBe("string");

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, deliveryId),
      });

      expect(delivery).toBeDefined();
      expect(delivery?.status).toBe("queued");
      expect(delivery?.phoneNumber).toBe("+5511999999999");
      expect(delivery?.metadata).toEqual({ order_id: "ORD-123", customer_name: "Carlos" });

      const job = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.orgId, org.id),
      });

      expect(job).toBeDefined();
      expect(job?.eventType).toBe("internal.survey.send");
    });
  });

  describe("AC #3: Invalid phone format rejected", () => {
    it("rejects phone missing + prefix", async () => {
      const org = await createTestOrg(`Invalid Phone ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Phone Validation Survey",
          type: "nps",
          status: "active",
          triggerType: "manual",
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
        expect((err as SurveySendError).message).toContain("E.164");
      }
    });

    it("rejects phone with invalid characters", async () => {
      const org = await createTestOrg(`Invalid Chars Phone ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Invalid Chars Phone Survey",
          type: "nps",
          status: "active",
          triggerType: "manual",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      await expect(
        queueSurveySend({
          orgId: org.id,
          surveyId: testSurvey!.id,
          phoneNumber: "+55abc123456",
        }),
      ).rejects.toThrow(SurveySendError);
    });
  });

  describe("AC #4: Inactive survey rejected", () => {
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
          triggerType: "manual",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
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
      }
    });
  });

  describe("AC #5: Optional metadata fields", () => {
    it("stores optional metadata when provided", async () => {
      const org = await createTestOrg(`Metadata Test ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "Metadata Survey",
          type: "nps",
          status: "active",
          triggerType: "manual",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      const deliveryId = await queueSurveySend({
        orgId: org.id,
        surveyId: testSurvey!.id,
        phoneNumber: "+5511888888888",
        metadata: {
          order_id: "ORD-456",
          customer_name: "Maria Silva",
        },
      });

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, deliveryId),
      });

      expect(delivery?.metadata).toEqual({
        order_id: "ORD-456",
        customer_name: "Maria Silva",
      });
    });

    it("works without metadata", async () => {
      const org = await createTestOrg(`No Metadata ${Date.now()}`);
      testOrgIds.push(org.id);

      const [testSurvey] = await db
        .insert(survey)
        .values({
          orgId: org.id,
          name: "No Metadata Survey",
          type: "nps",
          status: "active",
          triggerType: "manual",
          questions: [{ id: "q1", text: "Rate us?", type: "rating", required: true }],
        })
        .returning();

      const deliveryId = await queueSurveySend({
        orgId: org.id,
        surveyId: testSurvey!.id,
        phoneNumber: "+5511777777777",
      });

      const delivery = await db.query.surveyDelivery.findFirst({
        where: eq(surveyDelivery.id, deliveryId),
      });

      expect(delivery).toBeDefined();
      expect(delivery?.metadata).toBeNull();
    });
  });

  describe("Multi-tenancy isolation", () => {
    it("prevents sending to other org survey", async () => {
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
          triggerType: "manual",
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
});
