import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import { surveyDelivery, survey } from "@wp-nps/db/schema/flowpulse";

import { protectedProcedure } from "../index";
import { maskPhoneNumber } from "../utils/phone-mask";

const deliveryStatusSchema = z.enum([
  "pending",
  "queued",
  "sent",
  "delivered",
  "failed",
  "undeliverable",
  "responded",
]);

export const deliveryRouter = {
  list: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        status: deliveryStatusSchema.optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const existingSurvey = await db.query.survey.findFirst({
        where: and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)),
      });

      if (!existingSurvey) {
        throw new ORPCError("NOT_FOUND", {
          message: "Survey not found",
        });
      }

      const offset = (input.page - 1) * input.pageSize;

      const conditions = [
        eq(surveyDelivery.orgId, orgId),
        eq(surveyDelivery.surveyId, input.surveyId),
      ];

      if (input.status) {
        conditions.push(eq(surveyDelivery.status, input.status));
      }

      const deliveries = await db.query.surveyDelivery.findMany({
        where: and(...conditions),
        orderBy: [desc(surveyDelivery.createdAt)],
        limit: input.pageSize,
        offset,
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveyDelivery)
        .where(and(...conditions));

      const total = totalResult[0]?.count ?? 0;

      return {
        items: deliveries.map((d) => ({
          id: d.id,
          phoneNumberMasked: maskPhoneNumber(d.phoneNumber),
          status: d.status,
          metadata: d.metadata,
          errorMessage: d.errorMessage,
          isTest: d.isTest,
          retryCount: d.retryCount,
          maxRetries: d.maxRetries,
          createdAt: d.createdAt,
          deliveredAt: d.deliveredAt,
          respondedAt: d.respondedAt,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: offset + deliveries.length < total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active organization",
        });
      }

      const delivery = await db.query.surveyDelivery.findFirst({
        where: and(eq(surveyDelivery.id, input.id), eq(surveyDelivery.orgId, orgId)),
      });

      if (!delivery) {
        throw new ORPCError("NOT_FOUND", {
          message: "Delivery not found",
        });
      }

      return {
        id: delivery.id,
        surveyId: delivery.surveyId,
        phoneNumberMasked: maskPhoneNumber(delivery.phoneNumber),
        status: delivery.status,
        metadata: delivery.metadata,
        errorMessage: delivery.errorMessage,
        isTest: delivery.isTest,
        retryCount: delivery.retryCount,
        maxRetries: delivery.maxRetries,
        kapsoDeliveryId: delivery.kapsoDeliveryId,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
        deliveredAt: delivery.deliveredAt,
        respondedAt: delivery.respondedAt,
      };
    }),
};
