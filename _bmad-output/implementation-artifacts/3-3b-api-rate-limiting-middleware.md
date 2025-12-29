# Story 3.3b: API Rate Limiting Middleware

Status: ready-for-dev

## Story

As a **System**,
I want to **enforce rate limiting across all API endpoints**,
So that **no single organization can overwhelm the system**.

## Acceptance Criteria

1. **Given** an organization makes API requests **When** they exceed 100 requests/minute (NFR-S10) **Then** subsequent requests receive 429 Too Many Requests **And** the response includes `Retry-After` header

2. **Given** rate limiting is applied **When** the minute window resets **Then** the organization can make requests again

3. **Given** a rate-limited request **When** the response is sent **Then** it includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers

4. **Given** the rate limiter is active **When** tracking requests **Then** it uses in-memory storage (Map-based for MVP) **And** counters reset every 60 seconds

5. **Given** multiple API endpoints exist **When** rate limiting is checked **Then** all `/api/v1/*` routes share the same limit per org

## Tasks / Subtasks

- [ ] Task 1: Create Rate Limiter Service (AC: #1, #2, #4)
  - [ ] 1.1 Create `packages/api/src/services/rate-limiter.ts`
  - [ ] 1.2 Implement in-memory counter Map with org_id keys
  - [ ] 1.3 Implement `checkRateLimit(orgId)` - returns remaining count
  - [ ] 1.4 Implement `incrementCounter(orgId)` - increments request count
  - [ ] 1.5 Implement window reset logic (60s intervals)
  - [ ] 1.6 Configure limit from environment (default: 100/min)

- [ ] Task 2: Create Rate Limit Middleware (AC: #1, #3)
  - [ ] 2.1 Create `packages/api/src/middleware/rate-limit.ts`
  - [ ] 2.2 Extract org_id from API key context
  - [ ] 2.3 Check rate limit before processing request
  - [ ] 2.4 Return 429 with Retry-After header when exceeded
  - [ ] 2.5 Add rate limit headers to all responses

- [ ] Task 3: Integrate with API Router (AC: #5)
  - [ ] 3.1 Apply middleware to `/api/v1/*` routes
  - [ ] 3.2 Ensure middleware runs after API key auth
  - [ ] 3.3 Test with multiple endpoints

- [ ] Task 4: Write Tests (AC: #1, #2, #3, #4)
  - [ ] 4.1 Create `tests/integration/rate-limiting.test.ts`
  - [ ] 4.2 Test 101st request returns 429
  - [ ] 4.3 Test rate limit headers present
  - [ ] 4.4 Test window reset allows new requests
  - [ ] 4.5 Test different orgs have separate limits

## Dev Notes

### Critical Architecture Compliance

**This story implements NFR-S10 (API rate limiting at 100 requests/minute per org).**

From architecture.md Decision 6:
- Unified middleware combining rate limiting + usage tracking
- In-memory counter per org (reset every 60s)
- Header: `X-RateLimit-Remaining` on all responses

### Previous Story Context

Story 3-3 (Survey Send API) establishes:
- External API at `/api/v1/*`
- API key authentication middleware
- `apiKeyOrg` context available in requests

This story adds rate limiting on top of that infrastructure.

### Rate Limiter Service

```typescript
// packages/api/src/services/rate-limiter.ts

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 100;
const WINDOW_MS = 60_000; // 1 minute

export function getRateLimitConfig() {
  return {
    limit: parseInt(process.env.API_RATE_LIMIT ?? String(DEFAULT_LIMIT), 10),
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
  
  // Reset if window expired
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

// Cleanup old entries periodically (memory management)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (entry.resetAt <= now) {
      rateLimits.delete(key);
    }
  }
}, 60_000);
```

### Rate Limit Middleware

```typescript
// packages/api/src/middleware/rate-limit.ts
import { Elysia } from 'elysia';
import { checkRateLimit, incrementRateLimit } from '../services/rate-limiter';

export const rateLimitMiddleware = new Elysia()
  .derive(({ apiKeyOrg, set }) => {
    if (!apiKeyOrg) {
      // No org context = no rate limiting (will fail auth anyway)
      return { rateLimitInfo: null };
    }
    
    const info = checkRateLimit(apiKeyOrg.orgId);
    
    // Set rate limit headers
    set.headers['X-RateLimit-Limit'] = String(info.limit);
    set.headers['X-RateLimit-Remaining'] = String(info.remaining);
    set.headers['X-RateLimit-Reset'] = String(Math.ceil(info.resetAt / 1000));
    
    return { rateLimitInfo: info };
  })
  .onBeforeHandle(({ rateLimitInfo, apiKeyOrg, set, error }) => {
    if (!rateLimitInfo || !apiKeyOrg) return;
    
    if (!rateLimitInfo.allowed) {
      const retryAfter = Math.ceil((rateLimitInfo.resetAt - Date.now()) / 1000);
      set.headers['Retry-After'] = String(retryAfter);
      
      return error(429, {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retry_after: retryAfter,
      });
    }
  })
  .onAfterHandle(({ apiKeyOrg }) => {
    // Increment counter after successful request
    if (apiKeyOrg) {
      incrementRateLimit(apiKeyOrg.orgId);
    }
  });
```

### Integration with API Router

```typescript
// apps/server/_source/routes/api-v1.ts
import { Elysia } from 'elysia';
import { apiKeyAuth } from '@wp-nps/api/middleware/api-key-auth';
import { rateLimitMiddleware } from '@wp-nps/api/middleware/rate-limit';

export const apiV1Router = new Elysia({ prefix: '/api/v1' })
  .use(apiKeyAuth)           // First: authenticate
  .use(rateLimitMiddleware)  // Second: rate limit
  // ... routes
```

### Response Headers

All `/api/v1/*` responses will include:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1735489234
```

When rate limited (429):

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735489234

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retry_after": 45
}
```

### Test Patterns

```typescript
// tests/integration/rate-limiting.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { generateApiKey } from '@wp-nps/api/services/api-key';

describe('API Rate Limiting', () => {
  let testOrg: { id: string };
  let apiKey: string;
  const baseUrl = 'http://localhost:3000/api/v1';

  beforeEach(async () => {
    testOrg = await createTestOrg();
    apiKey = await generateApiKey(testOrg.id);
  });

  it('includes rate limit headers on all responses', async () => {
    const response = await fetch(`${baseUrl}/surveys/test/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '+5511999999999' }),
    });
    
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('returns 429 after exceeding rate limit', async () => {
    // Make 100 requests
    const requests = Array(100).fill(null).map(() =>
      fetch(`${baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
    );
    await Promise.all(requests);
    
    // 101st request should fail
    const response = await fetch(`${baseUrl}/health`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeDefined();
    
    const data = await response.json();
    expect(data.error).toBe('Too Many Requests');
  });

  it('separate orgs have independent limits', async () => {
    const org2 = await createTestOrg('Org 2');
    const key2 = await generateApiKey(org2.id);
    
    // Exhaust org1's limit
    const org1Requests = Array(100).fill(null).map(() =>
      fetch(`${baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
    );
    await Promise.all(org1Requests);
    
    // Org2 should still work
    const org2Response = await fetch(`${baseUrl}/health`, {
      headers: { 'Authorization': `Bearer ${key2}` },
    });
    
    expect(org2Response.status).not.toBe(429);
  });

  it('allows requests after window reset', async () => {
    vi.useFakeTimers();
    
    // Exhaust limit
    const requests = Array(100).fill(null).map(() =>
      fetch(`${baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
    );
    await Promise.all(requests);
    
    // Advance time by 61 seconds
    vi.advanceTimersByTime(61_000);
    
    // Should work again
    const response = await fetch(`${baseUrl}/health`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    expect(response.status).not.toBe(429);
    
    vi.useRealTimers();
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-S10 | 100 requests/minute per org | In-memory counter with 60s window |
| NFR-I5 | Meaningful error codes | 429 with Retry-After header |

### Future Enhancements

For scale beyond MVP:
- Move to Redis for distributed rate limiting
- Add per-endpoint rate limits (e.g., survey send stricter than health)
- Add burst allowance (token bucket algorithm)
- Add rate limit by IP for unauthenticated endpoints

### Project Structure Notes

Files to create/modify:
- `packages/api/src/services/rate-limiter.ts` - NEW
- `packages/api/src/middleware/rate-limit.ts` - NEW
- `apps/server/_source/routes/api-v1.ts` - EXTEND with middleware
- `tests/integration/rate-limiting.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 6: API Rate Limiting & Usage Metering]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3b]
- [Source: _bmad-output/project-context.md#Middleware patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
