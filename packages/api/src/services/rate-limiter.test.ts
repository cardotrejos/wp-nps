import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  incrementRateLimit,
  getRateLimitConfig,
  resetRateLimits,
} from "./rate-limiter";

describe("Rate Limiter Service", () => {
  beforeEach(() => {
    // Reset rate limiter state before each test
    resetRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimits();
  });

  describe("getRateLimitConfig", () => {
    it("returns default limit of 100 when env not set", () => {
      const config = getRateLimitConfig();

      expect(config.limit).toBe(100);
      expect(config.windowMs).toBe(60_000);
    });

    it("reads limit from API_RATE_LIMIT env var", () => {
      vi.stubEnv("API_RATE_LIMIT", "50");

      const config = getRateLimitConfig();

      expect(config.limit).toBe(50);

      vi.unstubAllEnvs();
    });
  });

  describe("checkRateLimit", () => {
    it("allows first request for new org", () => {
      const result = checkRateLimit("org-1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(100);
      expect(result.limit).toBe(100);
    });

    it("returns resetAt timestamp in the future", () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = checkRateLimit("org-1");

      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetAt).toBe(now + 60_000);
    });

    it("decrements remaining count after increment", () => {
      checkRateLimit("org-1");
      incrementRateLimit("org-1");

      const result = checkRateLimit("org-1");

      expect(result.remaining).toBe(99);
    });

    it("tracks orgs independently", () => {
      // Increment org-1 five times
      for (let i = 0; i < 5; i++) {
        checkRateLimit("org-1");
        incrementRateLimit("org-1");
      }

      const org1Result = checkRateLimit("org-1");
      const org2Result = checkRateLimit("org-2");

      expect(org1Result.remaining).toBe(95);
      expect(org2Result.remaining).toBe(100);
    });

    it("returns allowed=false when limit exceeded", () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        checkRateLimit("org-1");
        incrementRateLimit("org-1");
      }

      const result = checkRateLimit("org-1");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("incrementRateLimit", () => {
    it("increments counter for org", () => {
      checkRateLimit("org-1"); // Initialize entry
      incrementRateLimit("org-1");

      const result = checkRateLimit("org-1");

      expect(result.remaining).toBe(99);
    });

    it("does nothing if org has no entry", () => {
      // Should not throw
      expect(() => incrementRateLimit("unknown-org")).not.toThrow();
    });
  });

  describe("window reset logic", () => {
    it("resets counter after window expires", () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        checkRateLimit("org-1");
        incrementRateLimit("org-1");
      }

      const beforeReset = checkRateLimit("org-1");
      expect(beforeReset.remaining).toBe(50);

      // Advance time past the window
      vi.advanceTimersByTime(61_000);

      const afterReset = checkRateLimit("org-1");
      expect(afterReset.remaining).toBe(100);
      expect(afterReset.allowed).toBe(true);
    });

    it("allows requests again after window reset even when rate-limited", () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Exhaust the limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit("org-1");
        incrementRateLimit("org-1");
      }

      const rateLimited = checkRateLimit("org-1");
      expect(rateLimited.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(61_000);

      const afterReset = checkRateLimit("org-1");
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(100);
    });
  });
});
