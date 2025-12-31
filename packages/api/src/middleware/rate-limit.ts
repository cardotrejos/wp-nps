import { Elysia } from "elysia";
import { checkRateLimit, incrementRateLimit } from "../services/rate-limiter";
import type { ApiKeyContext } from "./api-key-auth";

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export const rateLimitMiddleware = new Elysia({ name: "rate-limit" })
  .derive(({ store }) => {
    const apiKeyOrg = (store as { apiKeyOrg?: ApiKeyContext | null }).apiKeyOrg;

    if (!apiKeyOrg) {
      return { rateLimitInfo: null as RateLimitInfo | null };
    }

    const info = checkRateLimit(apiKeyOrg.orgId);

    return { rateLimitInfo: info };
  })
  .onBeforeHandle(({ rateLimitInfo, set, store }) => {
    const apiKeyOrg = (store as { apiKeyOrg?: ApiKeyContext | null }).apiKeyOrg;

    if (!rateLimitInfo || !apiKeyOrg) {
      return;
    }

    set.headers["X-RateLimit-Limit"] = String(rateLimitInfo.limit);
    set.headers["X-RateLimit-Remaining"] = String(
      rateLimitInfo.allowed ? rateLimitInfo.remaining - 1 : 0,
    );
    set.headers["X-RateLimit-Reset"] = String(Math.ceil(rateLimitInfo.resetAt / 1000));

    if (!rateLimitInfo.allowed) {
      const retryAfter = Math.ceil((rateLimitInfo.resetAt - Date.now()) / 1000);
      set.headers["Retry-After"] = String(retryAfter);
      set.status = 429;

      return {
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retry_after: retryAfter,
      };
    }
  })
  .onAfterHandle(({ store }) => {
    const apiKeyOrg = (store as { apiKeyOrg?: ApiKeyContext | null }).apiKeyOrg;

    if (apiKeyOrg) {
      incrementRateLimit(apiKeyOrg.orgId);
    }
  });
