import { z } from "zod";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import { surveyResponse, surveyDelivery, customer } from "@wp-nps/db/schema/flowpulse";

import { protectedProcedure } from "../index";

function categorizeScore(score: number | null): "promoter" | "passive" | "detractor" | null {
  if (score === null) return null;
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const dashboardRouter = {
  getStats: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [responsesResult, deliveriesResult, categoryResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveyResponse)
        .where(
          and(
            eq(surveyResponse.orgId, orgId),
            eq(surveyResponse.isTest, false),
            gte(surveyResponse.createdAt, thirtyDaysAgo),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveyDelivery)
        .where(
          and(
            eq(surveyDelivery.orgId, orgId),
            eq(surveyDelivery.isTest, false),
            gte(surveyDelivery.createdAt, thirtyDaysAgo),
          ),
        ),
      db
        .select({
          category: surveyResponse.category,
          count: sql<number>`count(*)::int`,
        })
        .from(surveyResponse)
        .where(
          and(
            eq(surveyResponse.orgId, orgId),
            eq(surveyResponse.isTest, false),
            gte(surveyResponse.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(surveyResponse.category),
    ]);

    const totalResponses = responsesResult[0]?.count ?? 0;
    const totalSent = deliveriesResult[0]?.count ?? 0;
    const responseRate = totalSent > 0 ? ((totalResponses / totalSent) * 100).toFixed(1) : "0.0";

    const categoryMap = categoryResult.reduce(
      (acc, row) => {
        if (row.category) {
          acc[row.category] = row.count;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const promoters = categoryMap.promoter ?? 0;
    const passives = categoryMap.passive ?? 0;
    const detractors = categoryMap.detractor ?? 0;
    const totalCategorized = promoters + passives + detractors;

    const npsScore =
      totalCategorized > 0
        ? Math.round(((promoters - detractors) / totalCategorized) * 100)
        : null;

    const activeContactsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customer)
      .where(
        and(eq(customer.orgId, orgId), gte(customer.lastSeenAt, thirtyDaysAgo)),
      );

    const activeContacts = activeContactsResult[0]?.count ?? 0;

    return {
      totalSent,
      totalResponses,
      responseRate: `${responseRate}%`,
      npsScore,
      activeContacts,
      breakdown: {
        promoters,
        passives,
        detractors,
      },
    };
  }),

  getRecentResponses: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const limit = input?.limit ?? 10;

      const responses = await db.query.surveyResponse.findMany({
        where: and(eq(surveyResponse.orgId, orgId), eq(surveyResponse.isTest, false)),
        orderBy: [desc(surveyResponse.createdAt)],
        limit,
        with: {
          customer: true,
        },
      });

      return responses.map((r) => ({
        id: r.id,
        score: r.score,
        feedback: r.feedback,
        category: r.category ?? categorizeScore(r.score),
        customerPhone: r.customerPhone.replace(/(\d{2})\d+(\d{4})/, "$1****$2"),
        createdAt: r.createdAt.toISOString(),
        timeAgo: formatTimeAgo(r.createdAt),
      }));
    }),
};
