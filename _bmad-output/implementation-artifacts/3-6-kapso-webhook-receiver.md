# Story 3.6: Kapso Webhook Receiver

Status: done

## Story

As a **System**,
I want to **receive survey responses via Kapso webhooks**,
So that **customer feedback is captured in real-time**.

## Acceptance Criteria

1. **Given** a customer completes a survey **When** Kapso sends a webhook to `/webhooks/kapso` **Then** the webhook is processed in < 5 seconds (NFR-I2) **And** the response is stored with score and feedback

2. **Given** the webhook payload is received **When** it contains NPS score (0-10) and optional feedback **Then** the `survey_response` record is created **And** delivery status updates to "responded" (FR17)

3. **Given** the webhook signature is invalid **When** the request is received **Then** it is rejected with 401 Unauthorized **And** no data is stored

4. **Given** a duplicate webhook is received **When** using the same idempotency key **Then** it is acknowledged with 200 OK **And** no duplicate data is created

5. **Given** the webhook contains a response **When** it is processed **Then** customer PII is excluded from logs (NFR-S9)

## Tasks / Subtasks

- [x] Task 1: Create Webhook Endpoint (AC: #1, #3)
  - [x] 1.1 Create `apps/server/_source/webhooks/kapso.ts`
  - [x] 1.2 Add POST `/webhooks/kapso` route
  - [x] 1.3 Extract and verify signature from `X-Webhook-Signature` header
  - [x] 1.4 Use `kapsoClient.verifyWebhook()` for verification
  - [x] 1.5 Return 401 if signature invalid

- [x] Task 2: Parse Webhook Payload (AC: #2)
  - [x] 2.1 Create `packages/kapso/src/webhook-parser.ts`
  - [x] 2.2 Parse Kapso webhook v2 payload structure
  - [x] 2.3 Extract phone_number_id (org mapping)
  - [x] 2.4 Extract message content (score/feedback)
  - [x] 2.5 Extract message type and direction

- [x] Task 3: Implement Idempotency (AC: #4)
  - [x] 3.1 Extract idempotency key from payload (whatsapp_message_id)
  - [x] 3.2 Check if webhook_job exists with same key
  - [x] 3.3 Return 200 OK if duplicate
  - [x] 3.4 Create webhook_job for new webhooks

- [x] Task 4: Queue Response Processing (AC: #1, #2)
  - [x] 4.1 Insert webhook into `webhook_jobs` queue
  - [x] 4.2 Use event_type `kapso.message.received`
  - [x] 4.3 Return 202 Accepted immediately
  - [x] 4.4 Process asynchronously via job handler

- [x] Task 5: Implement Secure Logging (AC: #5)
  - [x] 5.1 Create `packages/api/src/utils/secure-logger.ts`
  - [x] 5.2 Implement `redactPII(payload)` - removes phone numbers
  - [x] 5.3 Use secure logger for webhook logs
  - [x] 5.4 Never log full phone numbers

- [x] Task 6: Write Tests (AC: #1, #2, #3, #4)
  - [x] 6.1 Create `tests/integration/kapso-webhook.test.ts`
  - [x] 6.2 Test valid signature acceptance
  - [x] 6.3 Test invalid signature rejection
  - [x] 6.4 Test idempotent duplicate handling
  - [x] 6.5 Test payload parsing
  - [x] 6.6 Test PII redaction in logs

## Dev Notes

### Critical Architecture Compliance

**This story implements FR25, FR26, NFR-I2, NFR-S9.**

From architecture.md Decision 3 (Webhook Handling):
- Webhooks queued in `webhook_jobs` table
- Idempotency key from Kapso payload
- Immediate 202 response, async processing
- PII excluded from logs

### Previous Story Context

Story 3-0 established:
- `kapsoClient.verifyWebhook()` method
- `KapsoMockClient` with `mockValidSignature()` and `mockInvalidSignature()`

Story 3-1 established:
- `webhook_jobs` table with idempotency
- `enqueueJob()` function
- Job processor with handler registry

### Kapso Webhook Payload Structure

```typescript
// Based on Kapso API v2 documentation
interface KapsoWebhookPayload {
  phone_number_id: string;  // Maps to org's connected WhatsApp
  message: {
    phone_number: string;           // Customer's phone (PII)
    content: string;                // Message text (score/feedback)
    whatsapp_message_id: string;    // Idempotency key
    type: 'text' | 'interactive';
    kapso: {
      direction: 'inbound' | 'outbound';
      origin: string;
    };
  };
  conversation: {
    id: string;
    phone_number: string;
    phone_number_id: string;
  };
}
```

### Webhook Parser

```typescript
// packages/kapso/src/webhook-parser.ts

export interface ParsedWebhook {
  phoneNumberId: string;
  customerPhone: string;
  messageId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
}

export interface ParsedSurveyResponse {
  score: number | null;
  feedback: string | null;
}

export function parseKapsoWebhook(payload: unknown): ParsedWebhook {
  const p = payload as KapsoWebhookPayload;
  
  return {
    phoneNumberId: p.phone_number_id,
    customerPhone: p.message.phone_number,
    messageId: p.message.whatsapp_message_id,
    content: p.message.content,
    direction: p.message.kapso.direction,
    timestamp: new Date().toISOString(),
  };
}

export function parseSurveyResponse(content: string, surveyType: 'nps' | 'csat' | 'ces'): ParsedSurveyResponse {
  // Extract numeric score from message
  const numberMatch = content.match(/\b(\d{1,2})\b/);
  let score: number | null = null;
  
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    
    switch (surveyType) {
      case 'nps':
        if (num >= 0 && num <= 10) score = num;
        break;
      case 'csat':
        if (num >= 1 && num <= 5) score = num;
        break;
      case 'ces':
        if (num >= 1 && num <= 7) score = num;
        break;
    }
  }
  
  // Extract feedback (text after the number)
  const feedback = score !== null
    ? content.replace(/\b\d{1,2}\b/, '').trim() || null
    : content.trim() || null;
  
  return { score, feedback };
}
```

### Webhook Endpoint

```typescript
// apps/server/_source/webhooks/kapso.ts
import { Elysia } from 'elysia';
import { createKapsoClient } from '@wp-nps/kapso';
import { parseKapsoWebhook } from '@wp-nps/kapso/webhook-parser';
import { enqueueJob } from '@wp-nps/api/services/job-queue';
import { db } from '@wp-nps/db';
import { whatsappConnection } from '@wp-nps/db/schema';
import { eq } from 'drizzle-orm';
import { secureLog } from '@wp-nps/api/utils/secure-logger';

export const kapsoWebhookRouter = new Elysia({ prefix: '/webhooks' })
  .post('/kapso', async ({ request, body, set }) => {
    const kapso = createKapsoClient();
    
    // Get signature from header
    const signature = request.headers.get('x-webhook-signature');
    if (!signature) {
      set.status = 401;
      return { error: 'Missing signature' };
    }
    
    // Verify signature
    const rawBody = JSON.stringify(body);
    if (!kapso.verifyWebhook(signature, rawBody)) {
      secureLog.warn('Invalid webhook signature received');
      set.status = 401;
      return { error: 'Invalid signature' };
    }
    
    // Parse webhook
    const parsed = parseKapsoWebhook(body);
    
    // Only process inbound messages (customer responses)
    if (parsed.direction !== 'inbound') {
      return { status: 'ignored', reason: 'Not an inbound message' };
    }
    
    // Find org by phone_number_id
    const connection = await db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.phoneNumberId, parsed.phoneNumberId),
    });
    
    if (!connection) {
      secureLog.warn('Webhook received for unknown phone_number_id', { phoneNumberId: parsed.phoneNumberId });
      set.status = 404;
      return { error: 'Unknown phone number' };
    }
    
    // Idempotency key
    const idempotencyKey = `kapso:${parsed.messageId}`;
    
    // Queue for processing
    const jobId = await enqueueJob({
      orgId: connection.orgId,
      idempotencyKey,
      source: 'kapso',
      eventType: 'kapso.message.received',
      payload: {
        phoneNumberId: parsed.phoneNumberId,
        customerPhone: parsed.customerPhone,
        messageId: parsed.messageId,
        content: parsed.content,
      },
    });
    
    if (jobId === null) {
      // Idempotent - duplicate webhook
      secureLog.info('Duplicate webhook ignored', { messageId: parsed.messageId });
      return { status: 'duplicate' };
    }
    
    secureLog.info('Webhook queued for processing', { jobId, messageId: parsed.messageId });
    
    set.status = 202;
    return { status: 'accepted', job_id: jobId };
  });
```

### Secure Logger

```typescript
// packages/api/src/utils/secure-logger.ts

const PII_PATTERNS = [
  /\+\d{10,15}/g,           // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
];

function redactPII(obj: unknown): unknown {
  if (typeof obj === 'string') {
    let result = obj;
    for (const pattern of PII_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]');
    }
    return result;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  }
  
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact known PII fields
      if (['phone', 'phone_number', 'customerPhone', 'email'].includes(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactPII(value);
      }
    }
    return result;
  }
  
  return obj;
}

export const secureLog = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, data ? redactPII(data) : '');
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, data ? redactPII(data) : '');
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, data ? redactPII(data) : '');
  },
};
```

### Test Patterns

```typescript
// tests/integration/kapso-webhook.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { db } from '@wp-nps/db';
import { whatsappConnection, webhookJob } from '@wp-nps/db/schema';
import { KapsoMockClient } from '@wp-nps/kapso';

describe('Kapso Webhook Receiver', () => {
  let testOrg: { id: string };
  let kapsoMock: KapsoMockClient;

  beforeEach(async () => {
    testOrg = await createTestOrg();
    kapsoMock = new KapsoMockClient();
    kapsoMock.reset();
    
    // Create WhatsApp connection
    await db.insert(whatsappConnection).values({
      orgId: testOrg.id,
      phoneNumberId: 'test-phone-id',
      status: 'active',
    });
  });

  it('accepts webhook with valid signature', async () => {
    kapsoMock.mockValidSignature('valid-sig');
    
    const response = await fetch('http://localhost:3000/webhooks/kapso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'valid-sig',
      },
      body: JSON.stringify({
        phone_number_id: 'test-phone-id',
        message: {
          phone_number: '+5511999999999',
          content: '9',
          whatsapp_message_id: 'msg-123',
          type: 'text',
          kapso: { direction: 'inbound', origin: 'user' },
        },
        conversation: { id: 'conv-1', phone_number: '+5511999999999', phone_number_id: 'test-phone-id' },
      }),
    });
    
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.status).toBe('accepted');
  });

  it('rejects webhook with invalid signature', async () => {
    kapsoMock.mockInvalidSignature('bad-sig');
    
    const response = await fetch('http://localhost:3000/webhooks/kapso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'bad-sig',
      },
      body: JSON.stringify({}),
    });
    
    expect(response.status).toBe(401);
  });

  it('handles duplicate webhooks idempotently', async () => {
    kapsoMock.setDefaultWebhookVerification(true);
    
    const payload = {
      phone_number_id: 'test-phone-id',
      message: {
        phone_number: '+5511999999999',
        content: '8',
        whatsapp_message_id: 'duplicate-msg-123',
        type: 'text',
        kapso: { direction: 'inbound', origin: 'user' },
      },
      conversation: { id: 'conv-1', phone_number: '+5511999999999', phone_number_id: 'test-phone-id' },
    };
    
    // First request
    const response1 = await fetch('http://localhost:3000/webhooks/kapso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': 'valid' },
      body: JSON.stringify(payload),
    });
    expect(response1.status).toBe(202);
    
    // Duplicate request
    const response2 = await fetch('http://localhost:3000/webhooks/kapso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': 'valid' },
      body: JSON.stringify(payload),
    });
    expect(response2.status).toBe(200);
    const data2 = await response2.json();
    expect(data2.status).toBe('duplicate');
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-I2 | Webhook processing < 5s | Immediate queue, async processing |
| NFR-S9 | Exclude PII from logs | Secure logger with redaction |

### Project Structure Notes

Files to create/modify:
- `packages/kapso/src/webhook-parser.ts` - NEW
- `packages/kapso/src/index.ts` - EXPORT webhook parser
- `packages/api/src/utils/secure-logger.ts` - NEW
- `apps/server/_source/webhooks/kapso.ts` - NEW
- `apps/server/_source/index.ts` - ADD webhook routes
- `tests/integration/kapso-webhook.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 3: Webhook Handling Pattern]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6]
- [Source: _bmad-output/implementation-artifacts/3-0-kapso-integration-package.md#Webhook verification]
- [Source: _bmad-output/implementation-artifacts/3-1-webhook-job-queue-infrastructure.md#Idempotency]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (Sisyphus)

### Debug Log References

N/A

### Completion Notes List

1. **Webhook Parser**: Created `packages/kapso/src/webhook-parser.ts` with `parseKapsoWebhook()`, `parseSurveyResponse()`, and `isValidWebhookPayload()` functions. Exported from `packages/kapso/src/index.ts`.

2. **Secure Logger**: Created `packages/api/src/utils/secure-logger.ts` with `redactPII()` function that removes phone numbers and emails from logs. NFR-S9 compliant.

3. **Webhook Endpoint**: Created `apps/server/_source/webhooks/kapso.ts` with POST `/webhooks/kapso` route. Signature verification, org lookup by `phoneNumberId` in JSONB metadata field, idempotency via `enqueueJob()`, and 202 Accepted response.

4. **Org Lookup**: Uses `whatsappConnection.metadata` JSONB field to find org by `phoneNumberId`. The `metadata` field stores `{ phoneNumberId: string }`.

5. **Idempotency**: Uses `kapso:{messageId}` as idempotency key. `enqueueJob()` returns `null` for duplicates (via `onConflictDoNothing`).

6. **Tests**: 20 integration tests covering all acceptance criteria. All tests pass.

### File List

| File | Status |
|------|--------|
| `packages/kapso/src/webhook-parser.ts` | NEW |
| `packages/kapso/src/index.ts` | MODIFIED - Added webhook parser exports |
| `packages/api/src/utils/secure-logger.ts` | NEW |
| `packages/api/package.json` | MODIFIED - Added utils/* and middleware/* exports |
| `apps/server/_source/webhooks/kapso.ts` | NEW |
| `apps/server/_source/index.ts` | MODIFIED - Mounted kapsoWebhookRouter |
| `tests/integration/kapso-webhook.test.ts` | NEW |
| `tests/integration/kapso-webhook-http.test.ts` | NEW (code-review) - HTTP endpoint integration tests |
| `packages/db/src/types/job-queue.ts` | MODIFIED (code-review) - Added KapsoWebhookReceivedPayload type |
| `packages/db/src/schema/flowpulse.ts` | MODIFIED (code-review) - Added index on metadata->>'phoneNumberId' |
| `package.json` | MODIFIED (code-review) - Added elysia and @wp-nps/api to devDependencies for tests |

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-30 | Code Review (Sisyphus) | Fixed payload type mismatch (added KapsoWebhookReceivedPayload); Added HTTP integration tests (8 tests); Added JSONB index for phoneNumberId; Added explicit 200 status for duplicates; Removed incorrect index.ts reference from Dev Notes |
