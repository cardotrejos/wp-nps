import { createHash } from "node:crypto";
import { eq, and, desc } from "drizzle-orm";
import { db, surveyResponse, surveyDelivery, customer } from "@wp-nps/db";
import { updateOrgMetrics } from "./metrics-updater";

export type NPSCategory = "promoter" | "passive" | "detractor";

export interface ProcessResponseParams {
  orgId: string;
  customerPhone: string;
  score: number;
  feedback: string | null;
  messageId: string;
}

export interface ProcessResponseResult {
  responseId: string;
  category: NPSCategory;
  customerId: string;
  deliveryId: string;
}

export function categorizeNPS(score: number): NPSCategory {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

function hashPhoneNumber(phoneNumber: string): string {
  return createHash("sha256").update(phoneNumber).digest("hex");
}

export async function processResponse(
  params: ProcessResponseParams
): Promise<ProcessResponseResult> {
  const { orgId, customerPhone, score, feedback } = params;
  const phoneHash = hashPhoneNumber(customerPhone);
  const category = categorizeNPS(score);

  return await db.transaction(async (tx) => {
    let customerRecord = await tx.query.customer.findFirst({
      where: and(eq(customer.orgId, orgId), eq(customer.phoneNumberHash, phoneHash)),
    });

    if (!customerRecord) {
      const [newCustomer] = await tx
        .insert(customer)
        .values({
          orgId,
          phoneNumberHash: phoneHash,
        })
        .returning();
      customerRecord = newCustomer;
    } else {
      await tx
        .update(customer)
        .set({ lastSeenAt: new Date() })
        .where(eq(customer.id, customerRecord.id));
    }

    if (!customerRecord) {
      throw new Error("Failed to find or create customer record");
    }

    const delivery = await tx.query.surveyDelivery.findFirst({
      where: and(
        eq(surveyDelivery.orgId, orgId),
        eq(surveyDelivery.phoneNumberHash, phoneHash),
        eq(surveyDelivery.status, "sent")
      ),
      orderBy: [desc(surveyDelivery.createdAt)],
    });

    if (!delivery) {
      throw new Error("No matching delivery found for response");
    }

    const [response] = await tx
      .insert(surveyResponse)
      .values({
        orgId,
        surveyId: delivery.surveyId,
        deliveryId: delivery.id,
        customerId: customerRecord.id,
        customerPhone,
        score,
        category,
        feedback,
        metadata: delivery.metadata,
        isTest: delivery.isTest,
        respondedAt: new Date(),
      })
      .returning({ id: surveyResponse.id });

    if (!response) {
      throw new Error("Failed to create survey response");
    }

    await tx
      .update(surveyDelivery)
      .set({
        status: "responded",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(surveyDelivery.id, delivery.id));

    await updateOrgMetrics(tx, orgId, { score, category, isTest: delivery.isTest });

    return {
      responseId: response.id,
      category,
      customerId: customerRecord.id,
      deliveryId: delivery.id,
    };
  });
}
