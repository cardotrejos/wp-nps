import { cors } from "@elysiajs/cors";
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
  .use(apiV1Router)
  .use(kapsoWebhookRouter)
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
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

// Export for Vercel serverless
export default app;
