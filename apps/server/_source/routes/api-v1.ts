import { Elysia, t } from "elysia";
import { apiKeyAuth, type ApiKeyContext } from "@wp-nps/api/middleware/api-key-auth";
import { rateLimitMiddleware, type RateLimitInfo } from "@wp-nps/api/middleware/rate-limit";
import { queueSurveySend, SurveySendError } from "@wp-nps/api/services/survey-send";

type ApiKeyDerived = { apiKeyOrg: ApiKeyContext | null; rateLimitInfo: RateLimitInfo | null };

export const apiV1Router = new Elysia({ prefix: "/api/v1" })
  .use(apiKeyAuth)
  .use(rateLimitMiddleware)
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .post(
    "/surveys/:surveyId/send",
    async (ctx) => {
      const { params, body, set } = ctx;
      const { apiKeyOrg } = ctx as typeof ctx & ApiKeyDerived;

      if (!apiKeyOrg) {
        set.status = 401;
        return { error: "Invalid or missing API key" };
      }

      try {
        const deliveryId = await queueSurveySend({
          orgId: apiKeyOrg.orgId,
          surveyId: params.surveyId,
          phoneNumber: body.phone,
          metadata: body.metadata,
        });

        set.status = 202;
        return {
          delivery_id: deliveryId,
          status: "queued" as const,
          message: "Survey send queued successfully",
        };
      } catch (err) {
        if (err instanceof SurveySendError) {
          if (err.code === "SURVEY_NOT_FOUND") {
            set.status = 404;
            return { error: "Survey not found" };
          }
          if (err.code === "SURVEY_INACTIVE" || err.code === "INVALID_PHONE") {
            set.status = 400;
            return { error: err.message };
          }
        }
        throw err;
      }
    },
    {
      params: t.Object({
        surveyId: t.String(),
      }),
      body: t.Object({
        phone: t.String({ pattern: "^\\+[1-9]\\d{1,14}$" }),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      response: {
        202: t.Object({
          delivery_id: t.String(),
          status: t.Literal("queued"),
          message: t.String(),
        }),
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        429: t.Object({
          error: t.String(),
          message: t.String(),
          retry_after: t.Number(),
        }),
      },
    },
  );
