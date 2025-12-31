import { eq } from "drizzle-orm";
import { orgMetrics } from "@wp-nps/db";
import type { DbClient } from "@wp-nps/db";
import type { NPSCategory } from "./response-processor";

interface ResponseData {
  score: number;
  category: NPSCategory;
  isTest: boolean;
}

function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function updateOrgMetrics(
  tx: DbClient,
  orgId: string,
  response: ResponseData
): Promise<void> {
  if (response.isTest) {
    return;
  }

  const today = getStartOfToday();

  const existingMetrics = await tx.query.orgMetrics.findFirst({
    where: (table, { and, eq: eqOp }) =>
      and(eqOp(table.orgId, orgId), eqOp(table.metricDate, today)),
  });

  if (existingMetrics) {
    const newTotalResponses = existingMetrics.totalResponses + 1;
    const newPromoterCount =
      existingMetrics.promoterCount + (response.category === "promoter" ? 1 : 0);
    const newPassiveCount =
      existingMetrics.passiveCount + (response.category === "passive" ? 1 : 0);
    const newDetractorCount =
      existingMetrics.detractorCount + (response.category === "detractor" ? 1 : 0);

    const npsScore = calculateNPSScore(newPromoterCount, newDetractorCount, newTotalResponses);
    const responseRate =
      existingMetrics.totalSent > 0 ? (newTotalResponses / existingMetrics.totalSent) * 100 : null;

    await tx
      .update(orgMetrics)
      .set({
        promoterCount: newPromoterCount,
        passiveCount: newPassiveCount,
        detractorCount: newDetractorCount,
        totalResponses: newTotalResponses,
        npsScore: npsScore.toString(),
        responseRate: responseRate?.toString() ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orgMetrics.id, existingMetrics.id));
  } else {
    const promoterCount = response.category === "promoter" ? 1 : 0;
    const passiveCount = response.category === "passive" ? 1 : 0;
    const detractorCount = response.category === "detractor" ? 1 : 0;
    const npsScore = calculateNPSScore(promoterCount, detractorCount, 1);

    await tx.insert(orgMetrics).values({
      orgId,
      metricDate: today,
      promoterCount,
      passiveCount,
      detractorCount,
      totalResponses: 1,
      totalSent: 0,
      npsScore: npsScore.toString(),
    });
  }
}

function calculateNPSScore(
  promoterCount: number,
  detractorCount: number,
  totalResponses: number
): number {
  if (totalResponses === 0) return 0;
  const promoterPct = (promoterCount / totalResponses) * 100;
  const detractorPct = (detractorCount / totalResponses) * 100;
  return Math.round(promoterPct - detractorPct);
}

export async function incrementSentCount(orgId: string): Promise<void> {
  const today = getStartOfToday();

  const existingMetrics = await (await import("@wp-nps/db")).db.query.orgMetrics.findFirst({
    where: (table, { and, eq: eqOp }) =>
      and(eqOp(table.orgId, orgId), eqOp(table.metricDate, today)),
  });

  const db = (await import("@wp-nps/db")).db;

  if (existingMetrics) {
    const newTotalSent = existingMetrics.totalSent + 1;
    const responseRate =
      newTotalSent > 0 ? (existingMetrics.totalResponses / newTotalSent) * 100 : null;

    await db
      .update(orgMetrics)
      .set({
        totalSent: newTotalSent,
        responseRate: responseRate?.toString() ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orgMetrics.id, existingMetrics.id));
  } else {
    await db.insert(orgMetrics).values({
      orgId,
      metricDate: today,
      totalSent: 1,
      totalResponses: 0,
    });
  }
}
