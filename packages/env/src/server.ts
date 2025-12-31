import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "PUBLIC_",
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    KAPSO_API_KEY: z.string().min(1).optional(),
    KAPSO_WEBHOOK_SECRET: z.string().min(1).optional(),
    KAPSO_BASE_URL: z.string().url().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    APP_URL: z.string().url().default("http://localhost:3001"),
  },
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
