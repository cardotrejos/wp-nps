interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 100;
const WINDOW_MS = 60_000;

export function getRateLimitConfig() {
  return {
    limit: Number.parseInt(process.env.API_RATE_LIMIT ?? String(DEFAULT_LIMIT), 10),
    windowMs: WINDOW_MS,
  };
}

export function checkRateLimit(orgId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
} {
  const config = getRateLimitConfig();
  const now = Date.now();

  let entry = rateLimits.get(orgId);

  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimits.set(orgId, entry);
  }

  const remaining = Math.max(0, config.limit - entry.count);
  const allowed = entry.count < config.limit;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

export function incrementRateLimit(orgId: string): void {
  const entry = rateLimits.get(orgId);
  if (entry) {
    entry.count++;
  }
}

export function resetRateLimits(): void {
  rateLimits.clear();
}

// Cleanup expired entries periodically to prevent memory leaks
// Only runs in non-test environments to avoid interference with fake timers
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startCleanupInterval(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimits.entries()) {
      if (entry.resetAt <= now) {
        rateLimits.delete(key);
      }
    }
  }, 60_000);
}

export function stopCleanupInterval(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Auto-start cleanup in production (not during tests)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  startCleanupInterval();
}
