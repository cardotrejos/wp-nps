import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@wp-nps/api/context";
import { appRouter } from "@wp-nps/api/routers/index";
import { auth } from "@wp-nps/auth";
import { env } from "@wp-nps/env/server";
import { Elysia } from "elysia";
import { startProcessor, isProcessorRunning } from "./jobs/processor";
import { startScheduler, stopScheduler } from "./jobs/scheduler";
import { apiV1Router } from "./routes/api-v1";
import { kapsoWebhookRouter } from "./webhooks/kapso";

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .use(
    swagger({
      path: "/api/docs",
      documentation: {
        info: {
          title: "FlowPulse API",
          version: "1.0.0",
          description: `WhatsApp NPS survey delivery and response collection API.

## Authentication

All API endpoints require authentication using a Bearer token. Generate an API key from your FlowPulse dashboard settings.

Include the API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer fp_your_api_key
\`\`\`

## Rate Limiting

API requests are rate-limited to **100 requests per minute** per organization. Rate limit headers are included in all responses:

- \`X-RateLimit-Remaining\`: Requests remaining in current window
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets
- \`Retry-After\`: Seconds to wait before retrying (on 429 responses)

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_PHONE | 400 | Phone number must be in E.164 format |
| SURVEY_INACTIVE | 400 | Survey must be active to send |
| UNAUTHORIZED | 401 | API key is missing, invalid, or revoked |
| SURVEY_NOT_FOUND | 404 | Survey ID does not exist or belongs to another organization |
| RATE_LIMITED | 429 | Rate limit exceeded. Retry after indicated time |
| INTERNAL_ERROR | 500 | Unexpected server error |
`,
        },
        servers: [
          { url: env.NODE_ENV === "production" ? "https://api.flowpulse.io" : "http://localhost:3000", description: env.NODE_ENV === "production" ? "Production" : "Development" },
        ],
        tags: [
          { name: "Surveys", description: "Survey delivery and management endpoints" },
          { name: "Health", description: "API health and status endpoints" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "API Key",
              description: "API key from FlowPulse dashboard. Format: fp_xxx...",
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      exclude: ["/", "/health", "/rpc", "/api/auth", "/webhooks"],
    }),
  )
  .use(apiV1Router)
  .use(kapsoWebhookRouter)
  .get("/api/openapi.json", async ({ redirect }) => redirect("/api/docs/json"))
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all("/rpc*", async (context) => {
    const { response } = await rpcHandler.handle(context.request, {
      prefix: "/rpc",
      context: await createContext({ context }),
    });
    return response ?? new Response("Not Found", { status: 404 });
  })
  .all("/api*", async (context) => {
    const { response } = await apiHandler.handle(context.request, {
      prefix: "/api-reference",
      context: await createContext({ context }),
    });
    return response ?? new Response("Not Found", { status: 404 });
  })
  .get("/", () => "OK")
  .get("/health", () => ({
    status: "ok",
    jobProcessor: isProcessorRunning() ? "running" : "stopped",
  }));

if (env.NODE_ENV !== "production") {
  startProcessor();
  startScheduler();
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\n[Server] ${signal} received, shutting down gracefully...`);
    stopScheduler();
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

// Export for Vercel serverless
export default app;
