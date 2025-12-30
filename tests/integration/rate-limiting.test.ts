import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  incrementRateLimit,
  resetRateLimits,
  getRateLimitConfig,
} from "../../packages/api/src/services/rate-limiter";
import { generateApiKey } from "../../packages/api/src/services/api-key";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

describe("API Rate Limiting Integration (Story 3.3b)", () => {
  let testOrg: { id: string; name: string; slug: string };

  beforeEach(async () => {
    await clearOrgContext();
    resetRateLimits();
    testOrg = await createTestOrg(`Rate Limit Test Org ${Date.now()}`);
  });

  afterEach(async () => {
    await cleanupTestOrg(testOrg.id);
    await clearOrgContext();
    resetRateLimits();
  });

  describe("AC #1: Rate limit enforcement - 429 after 100 requests/minute", () => {
    it("allows first 100 requests", async () => {
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(testOrg.id);
        expect(result.allowed).toBe(true);
        incrementRateLimit(testOrg.id);
      }
    });

    it("blocks 101st request", async () => {
      for (let i = 0; i < 100; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const result = checkRateLimit(testOrg.id);
      expect(result.allowed).toBe(false);
    });

    it("returns retry info when blocked", async () => {
      for (let i = 0; i < 100; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const result = checkRateLimit(testOrg.id);
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe("AC #2: Window reset allows new requests", () => {
    it("provides window reset time in the future", async () => {
      const result = checkRateLimit(testOrg.id);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("resets to full limit after manual reset (simulates window expiry)", async () => {
      for (let i = 0; i < 50; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const beforeReset = checkRateLimit(testOrg.id);
      expect(beforeReset.remaining).toBe(50);

      resetRateLimits();

      const afterReset = checkRateLimit(testOrg.id);
      expect(afterReset.remaining).toBe(100);
      expect(afterReset.allowed).toBe(true);
    });
  });

  describe("AC #3: Rate limit headers", () => {
    it("returns limit value (100 by default)", async () => {
      const result = checkRateLimit(testOrg.id);
      expect(result.limit).toBe(100);
    });

    it("returns remaining count", async () => {
      checkRateLimit(testOrg.id);
      incrementRateLimit(testOrg.id);

      const result = checkRateLimit(testOrg.id);
      expect(result.remaining).toBe(99);
    });

    it("returns reset timestamp as unix seconds compatible", async () => {
      const result = checkRateLimit(testOrg.id);
      const resetInSeconds = Math.ceil(result.resetAt / 1000);

      expect(resetInSeconds).toBeGreaterThan(Date.now() / 1000 - 10);
    });
  });

  describe("AC #4: In-memory storage with 60s window", () => {
    it("uses configurable rate limit", async () => {
      const config = getRateLimitConfig();
      expect(config.limit).toBe(100);
      expect(config.windowMs).toBe(60_000);
    });

    it("uses in-memory Map storage that can be cleared", async () => {
      for (let i = 0; i < 100; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const blocked = checkRateLimit(testOrg.id);
      expect(blocked.allowed).toBe(false);

      resetRateLimits();

      const unblocked = checkRateLimit(testOrg.id);
      expect(unblocked.allowed).toBe(true);
    });
  });

  describe("AC #5: Multi-tenant isolation - separate limits per org", () => {
    let secondOrg: { id: string; name: string; slug: string };

    beforeEach(async () => {
      secondOrg = await createTestOrg(`Rate Limit Test Org 2 ${Date.now()}`);
    });

    afterEach(async () => {
      await cleanupTestOrg(secondOrg.id);
    });

    it("tracks each org independently", async () => {
      for (let i = 0; i < 50; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const org1Result = checkRateLimit(testOrg.id);
      const org2Result = checkRateLimit(secondOrg.id);

      expect(org1Result.remaining).toBe(50);
      expect(org2Result.remaining).toBe(100);
    });

    it("rate limiting one org does not affect another", async () => {
      for (let i = 0; i < 100; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const org1Result = checkRateLimit(testOrg.id);
      const org2Result = checkRateLimit(secondOrg.id);

      expect(org1Result.allowed).toBe(false);
      expect(org2Result.allowed).toBe(true);
    });
  });

  describe("API Key + Rate Limit Integration", () => {
    it("generates API key for org that can be rate limited", async () => {
      const apiKey = await generateApiKey(testOrg.id);
      expect(apiKey).toMatch(/^fp_/);

      for (let i = 0; i < 100; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const result = checkRateLimit(testOrg.id);
      expect(result.allowed).toBe(false);
    });
  });

  describe.skip("HTTP Endpoint Integration (AC #1, #3 verification) - requires E2E with real server", () => {
    const baseUrl = "http://localhost:3000/api/v1";

    it("includes X-RateLimit-* headers on successful response", async () => {
      const apiKey = await generateApiKey(testOrg.id);

      const response = await fetch(`${baseUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();

      const remaining = response.headers.get("X-RateLimit-Remaining");
      expect(Number(remaining)).toBeLessThanOrEqual(99);
    });

    it("decrements X-RateLimit-Remaining on each request", async () => {
      const apiKey = await generateApiKey(testOrg.id);

      const response1 = await fetch(`${baseUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const remaining1 = Number(response1.headers.get("X-RateLimit-Remaining"));

      const response2 = await fetch(`${baseUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const remaining2 = Number(response2.headers.get("X-RateLimit-Remaining"));

      expect(remaining2).toBe(remaining1 - 1);
    });

    it("returns 429 with Retry-After when rate limited", async () => {
      const apiKey = await generateApiKey(testOrg.id);

      for (let i = 0; i < 100; i++) {
        checkRateLimit(testOrg.id);
        incrementRateLimit(testOrg.id);
      }

      const response = await fetch(`${baseUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBeDefined();
      expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");

      const body = (await response.json()) as { error: string; retry_after: number };
      expect(body.error).toBe("Too Many Requests");
      expect(body.retry_after).toBeGreaterThan(0);
    });

    it("returns 401 without API key (no rate limit headers)", async () => {
      const response = await fetch(`${baseUrl}/health`);

      expect(response.status).toBe(401);
      expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
    });
  });
});
