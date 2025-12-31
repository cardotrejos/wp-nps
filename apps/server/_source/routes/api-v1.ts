import { Elysia, t } from "elysia";
import { apiKeyAuth, type ApiKeyContext } from "@wp-nps/api/middleware/api-key-auth";
import { rateLimitMiddleware, type RateLimitInfo } from "@wp-nps/api/middleware/rate-limit";
import { queueSurveySend, SurveySendError } from "@wp-nps/api/services/survey-send";

type ApiKeyDerived = { apiKeyOrg: ApiKeyContext | null; rateLimitInfo: RateLimitInfo | null };

export const apiV1Router = new Elysia({
  prefix: "/api/v1",
  detail: { tags: ["API"] },
})
  .use(apiKeyAuth)
  .use(rateLimitMiddleware)
  .get(
    "/health",
    () => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        summary: "Health Check",
        description: "Check if the API is running and responsive.",
        tags: ["Health"],
      },
      response: {
        200: t.Object({
          status: t.Literal("ok"),
          timestamp: t.String(),
        }),
      },
    },
  )
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
      detail: {
        summary: "Send Survey to Customer",
        description: `Queue a survey for delivery to a customer phone number via WhatsApp.

The survey will be sent asynchronously. Use the returned \`delivery_id\` to track delivery status.

**Example curl:**
\`\`\`bash
curl -X POST 'https://api.flowpulse.io/api/v1/surveys/srv_abc123/send' \\
  -H 'Authorization: Bearer fp_your_api_key' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phone": "+5511999999999",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_name": "Carlos"
    }
  }'
\`\`\``,
        tags: ["Surveys"],
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        surveyId: t.String({ description: "The unique identifier of the survey to send" }),
      }),
      body: t.Object({
        phone: t.String({
          pattern: "^\\+[1-9]\\d{1,14}$",
          description: "Customer phone number in E.164 format (e.g., +5511999999999)",
          examples: ["+5511999999999"],
        }),
        metadata: t.Optional(
          t.Record(t.String(), t.Unknown(), {
            description:
              "Custom metadata to attach to the delivery (e.g., order_id, customer_name)",
            examples: [{ order_id: "ORD-12345", customer_name: "Carlos" }],
          }),
        ),
      }),
      response: {
        202: t.Object({
          delivery_id: t.String({ description: "Unique identifier for tracking this delivery" }),
          status: t.Literal("queued", { description: "Initial status of the delivery" }),
          message: t.String({ description: "Human-readable confirmation message" }),
        }),
        400: t.Object({
          error: t.String({
            description:
              "INVALID_PHONE: Phone number must be in E.164 format. SURVEY_INACTIVE: Survey must be active to send.",
          }),
        }),
        401: t.Object({
          error: t.String({
            description: "UNAUTHORIZED: API key is missing, invalid, or revoked.",
          }),
        }),
        404: t.Object({
          error: t.String({
            description:
              "SURVEY_NOT_FOUND: Survey ID does not exist or belongs to another organization.",
          }),
        }),
        429: t.Object({
          error: t.String({ description: "RATE_LIMITED: Rate limit exceeded." }),
          message: t.String({ description: "Details about the rate limit." }),
          retry_after: t.Number({ description: "Seconds to wait before retrying." }),
        }),
      },
    },
  );
