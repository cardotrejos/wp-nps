# Story 3.3: Survey Send API Endpoint

Status: ready-for-dev

## Story

As a **Developer**,
I want to **trigger a survey send via REST API**,
So that **I can automate survey delivery from my application**.

## Acceptance Criteria

1. **Given** I have a valid API key **When** I POST to `/api/v1/surveys/{id}/send` with `{ phone: "+5511999999999" }` **Then** a survey send is queued **And** I receive a 202 Accepted with `{ delivery_id: "..." }` **And** response time is < 500ms (NFR-P3)

2. **Given** I include metadata in the request **When** I send `{ phone: "...", metadata: { order_id: "123", customer_name: "Carlos" } }` **Then** the metadata is stored with the delivery record (FR15)

3. **Given** the survey is inactive **When** I try to send it **Then** I receive a 400 Bad Request with message "Survey is not active"

4. **Given** I provide an invalid phone number **When** I POST the request **Then** I receive a 400 Bad Request with validation error details

5. **Given** I don't provide an API key **When** I POST the request **Then** I receive a 401 Unauthorized response

6. **Given** I provide an API key for a different organization **When** I try to send a survey **Then** I receive a 404 Not Found (multi-tenant isolation)

## Tasks / Subtasks

- [ ] Task 1: Create Survey Delivery Schema (AC: #1, #2)
  - [ ] 1.1 Add `survey_delivery` table to `packages/db/src/schema/flowpulse.ts`
  - [ ] 1.2 Define columns: id, org_id (FK), survey_id (FK), phone_number, metadata (JSONB), status, kapso_message_id, error_message, created_at, updated_at, delivered_at, responded_at
  - [ ] 1.3 Add indexes for org_id, survey_id, status
  - [ ] 1.4 Run `bun db:push` to apply schema

- [ ] Task 2: Create Survey Send Service (AC: #1, #2, #3)
  - [ ] 2.1 Create `packages/api/src/services/survey-send.ts`
  - [ ] 2.2 Implement `queueSurveySend(params)` - validates and queues
  - [ ] 2.3 Validate survey exists and is active
  - [ ] 2.4 Validate phone number format (E.164)
  - [ ] 2.5 Create `survey_delivery` record with status "pending"
  - [ ] 2.6 Queue job in `webhook_jobs` for async delivery

- [ ] Task 3: Create External API Router (AC: #1, #2, #3, #4, #5)
  - [ ] 3.1 Create `apps/server/_source/routes/api-v1.ts` for external API
  - [ ] 3.2 Add POST `/api/v1/surveys/:surveyId/send` endpoint
  - [ ] 3.3 Apply API key authentication middleware
  - [ ] 3.4 Parse and validate request body with Zod
  - [ ] 3.5 Return 202 Accepted with delivery_id
  - [ ] 3.6 Wire router to main server app

- [ ] Task 4: Create Request/Response Schemas (AC: #2, #4)
  - [ ] 4.1 Create `packages/api/src/schemas/survey-send.ts`
  - [ ] 4.2 Define `SurveySendRequestSchema` with phone and metadata
  - [ ] 4.3 Define `SurveySendResponseSchema` with delivery_id
  - [ ] 4.4 Add phone number validation (E.164 format)

- [ ] Task 5: Integrate with Job Queue (AC: #1)
  - [ ] 5.1 Create job handler in `apps/server/_source/jobs/handlers/survey-send.ts`
  - [ ] 5.2 Handler calls Kapso to send survey
  - [ ] 5.3 Updates delivery status on success/failure
  - [ ] 5.4 Register handler in job registry

- [ ] Task 6: Write Tests (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 6.1 Create `tests/integration/survey-send-api.test.ts`
  - [ ] 6.2 Test successful survey send with valid API key
  - [ ] 6.3 Test metadata is stored with delivery
  - [ ] 6.4 Test inactive survey rejection
  - [ ] 6.5 Test invalid phone number rejection
  - [ ] 6.6 Test missing API key rejection
  - [ ] 6.7 Test cross-org isolation

## Dev Notes

### Critical Architecture Compliance

**This story implements FR14-FR15 (API survey send with metadata) and NFR-P3 (< 500ms response).**

From architecture.md:
- External API uses `/api/v1/*` routes (separate from internal oRPC)
- API key authentication via `Authorization: Bearer {key}` header
- Async processing via `webhook_jobs` queue for < 500ms response

### Previous Story Context

Story 3-2 (API Key Generation) provides:
- `api_key` table with hashed keys
- `validateApiKey(rawKey)` service function
- `apiKeyAuth` middleware for Elysia

This story uses that infrastructure for authentication.

### Dependency Chain

```
API Key (3-2) → Survey Send API (3-3) → Survey Delivery via Kapso (3-4)
                                      ↓
                             Delivery Status Tracking (3-5)
```

### Survey Delivery Schema

```typescript
// packages/db/src/schema/flowpulse.ts
export const surveyDelivery = pgTable('survey_delivery', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organization.id),
  surveyId: text('survey_id').notNull().references(() => survey.id),
  phoneNumber: text('phone_number').notNull(), // E.164 format
  phoneNumberHash: text('phone_number_hash').notNull(), // For PII protection
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  status: text('status').notNull().default('pending'), // pending, queued, sent, delivered, failed, responded
  kapsoMessageId: text('kapso_message_id'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
}, (table) => [
  index('idx_survey_delivery_org').on(table.orgId),
  index('idx_survey_delivery_survey').on(table.surveyId),
  index('idx_survey_delivery_status').on(table.status),
  index('idx_survey_delivery_phone_hash').on(table.phoneNumberHash),
]);
```

### Request/Response Schema

```typescript
// packages/api/src/schemas/survey-send.ts
import { z } from 'zod';

// E.164 phone format: +[country code][number]
const phoneE164Schema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +5511999999999)');

export const surveySendRequestSchema = z.object({
  phone: phoneE164Schema,
  metadata: z.record(z.unknown()).optional(),
});

export const surveySendResponseSchema = z.object({
  delivery_id: z.string(),
  status: z.literal('queued'),
  message: z.string(),
});

export type SurveySendRequest = z.infer<typeof surveySendRequestSchema>;
export type SurveySendResponse = z.infer<typeof surveySendResponseSchema>;
```

### Survey Send Service

```typescript
// packages/api/src/services/survey-send.ts
import { createHash } from 'crypto';
import { db } from '@wp-nps/db';
import { survey, surveyDelivery } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { enqueueJob } from './job-queue';

interface QueueSurveySendParams {
  orgId: string;
  surveyId: string;
  phoneNumber: string;
  metadata?: Record<string, unknown>;
}

export class SurveySendError extends Error {
  constructor(
    message: string,
    public code: 'SURVEY_NOT_FOUND' | 'SURVEY_INACTIVE' | 'INVALID_PHONE' | 'QUEUE_FAILED'
  ) {
    super(message);
    this.name = 'SurveySendError';
  }
}

export async function queueSurveySend(params: QueueSurveySendParams): Promise<string> {
  const { orgId, surveyId, phoneNumber, metadata } = params;
  
  // Validate survey exists and belongs to org
  const surveyRecord = await db.query.survey.findFirst({
    where: and(
      eq(survey.id, surveyId),
      eq(survey.orgId, orgId)
    ),
  });
  
  if (!surveyRecord) {
    throw new SurveySendError('Survey not found', 'SURVEY_NOT_FOUND');
  }
  
  if (surveyRecord.status !== 'active') {
    throw new SurveySendError('Survey is not active', 'SURVEY_INACTIVE');
  }
  
  // Hash phone number for storage (PII protection)
  const phoneNumberHash = createHash('sha256').update(phoneNumber).digest('hex');
  
  // Create delivery record
  const [delivery] = await db.insert(surveyDelivery)
    .values({
      orgId,
      surveyId,
      phoneNumber, // Encrypted at rest by DB
      phoneNumberHash,
      metadata,
      status: 'pending',
    })
    .returning({ id: surveyDelivery.id });
  
  // Queue for async processing
  await enqueueJob({
    orgId,
    idempotencyKey: `survey-send:${delivery.id}`,
    source: 'internal',
    eventType: 'survey.send',
    payload: {
      deliveryId: delivery.id,
      surveyId,
      phoneNumber,
      metadata,
    },
  });
  
  // Update status to queued
  await db.update(surveyDelivery)
    .set({ status: 'queued', updatedAt: new Date() })
    .where(eq(surveyDelivery.id, delivery.id));
  
  return delivery.id;
}
```

### External API Router

```typescript
// apps/server/_source/routes/api-v1.ts
import { Elysia, t } from 'elysia';
import { apiKeyAuth } from '@wp-nps/api/middleware/api-key-auth';
import { queueSurveySend, SurveySendError } from '@wp-nps/api/services/survey-send';

export const apiV1Router = new Elysia({ prefix: '/api/v1' })
  .use(apiKeyAuth)
  .post(
    '/surveys/:surveyId/send',
    async ({ params, body, apiKeyOrg, error }) => {
      if (!apiKeyOrg) {
        return error(401, { error: 'Invalid or missing API key' });
      }
      
      try {
        const deliveryId = await queueSurveySend({
          orgId: apiKeyOrg.orgId,
          surveyId: params.surveyId,
          phoneNumber: body.phone,
          metadata: body.metadata,
        });
        
        return {
          delivery_id: deliveryId,
          status: 'queued',
          message: 'Survey send queued successfully',
        };
      } catch (err) {
        if (err instanceof SurveySendError) {
          if (err.code === 'SURVEY_NOT_FOUND') {
            return error(404, { error: 'Survey not found' });
          }
          if (err.code === 'SURVEY_INACTIVE') {
            return error(400, { error: err.message });
          }
        }
        throw err;
      }
    },
    {
      params: t.Object({
        surveyId: t.String(),
      }),
      body: t.Object({
        phone: t.String({ pattern: '^\\+[1-9]\\d{1,14}$' }),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      response: {
        202: t.Object({
          delivery_id: t.String(),
          status: t.Literal('queued'),
          message: t.String(),
        }),
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
      },
      detail: {
        tags: ['Surveys'],
        summary: 'Send a survey to a phone number',
        description: 'Queue a survey for delivery via WhatsApp. Requires API key authentication.',
      },
    }
  );
```

### Job Handler for Survey Send

```typescript
// apps/server/_source/jobs/handlers/survey-send.ts
import type { JobHandler } from '@wp-nps/db/types';
import { db } from '@wp-nps/db';
import { surveyDelivery, survey } from '@wp-nps/db/schema';
import { eq } from 'drizzle-orm';
import { createKapsoClient } from '@wp-nps/kapso';

interface SurveySendPayload {
  deliveryId: string;
  surveyId: string;
  phoneNumber: string;
  metadata?: Record<string, unknown>;
}

export const surveySendHandler: JobHandler = {
  eventType: 'survey.send',
  
  async handle(job) {
    const payload = job.payload as SurveySendPayload;
    const kapso = createKapsoClient();
    
    // Get survey details for message
    const surveyRecord = await db.query.survey.findFirst({
      where: eq(survey.id, payload.surveyId),
    });
    
    if (!surveyRecord) {
      throw new Error(`Survey ${payload.surveyId} not found`);
    }
    
    // Send via Kapso
    const result = await kapso.sendSurvey({
      orgId: job.orgId,
      phoneNumber: payload.phoneNumber,
      surveyId: payload.surveyId,
      message: surveyRecord.questionText ?? 'How likely are you to recommend us? Reply 0-10',
    });
    
    // Update delivery record
    await db.update(surveyDelivery)
      .set({
        status: 'sent',
        kapsoMessageId: result.deliveryId,
        updatedAt: new Date(),
      })
      .where(eq(surveyDelivery.id, payload.deliveryId));
  },
};
```

### Test Patterns

```typescript
// tests/integration/survey-send-api.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { generateApiKey } from '@wp-nps/api/services/api-key';
import { db } from '@wp-nps/db';
import { survey, surveyDelivery } from '@wp-nps/db/schema';

describe('POST /api/v1/surveys/:surveyId/send', () => {
  let testOrg: { id: string };
  let apiKey: string;
  let activeSurvey: { id: string };

  beforeEach(async () => {
    testOrg = await createTestOrg();
    apiKey = await generateApiKey(testOrg.id);
    
    // Create active survey
    const [s] = await db.insert(survey).values({
      orgId: testOrg.id,
      name: 'Test NPS Survey',
      type: 'nps',
      status: 'active',
      questionText: 'How likely are you to recommend us?',
    }).returning();
    activeSurvey = s;
  });

  it('returns 202 and queues survey send with valid API key', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/surveys/${activeSurvey.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+5511999999999',
        metadata: { order_id: '123' },
      }),
    });
    
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.delivery_id).toBeDefined();
    expect(data.status).toBe('queued');
  });

  it('returns 400 for inactive survey', async () => {
    // Deactivate survey
    await db.update(survey)
      .set({ status: 'inactive' })
      .where(eq(survey.id, activeSurvey.id));
    
    const response = await fetch(`http://localhost:3000/api/v1/surveys/${activeSurvey.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '+5511999999999' }),
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('not active');
  });

  it('returns 401 without API key', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/surveys/${activeSurvey.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+5511999999999' }),
    });
    
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid phone format', async () => {
    const response = await fetch(`http://localhost:3000/api/v1/surveys/${activeSurvey.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '11999999999' }), // Missing +
    });
    
    expect(response.status).toBe(400);
  });

  it('prevents cross-org survey access', async () => {
    const org2 = await createTestOrg('Org 2');
    const key2 = await generateApiKey(org2.id);
    
    // Try to send org1's survey with org2's key
    const response = await fetch(`http://localhost:3000/api/v1/surveys/${activeSurvey.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key2}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '+5511999999999' }),
    });
    
    expect(response.status).toBe(404);
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-P3 | API responds < 500ms | Async queue, immediate 202 response |
| NFR-I4 | RESTful with JSON | Standard REST patterns |
| NFR-I5 | Meaningful error codes | 400, 401, 404 with messages |
| NFR-S2 | Phone numbers encrypted at rest | PostgreSQL encryption + hash for queries |

### Project Structure Notes

Files to create/modify:
- `packages/db/src/schema/flowpulse.ts` - ADD survey_delivery table
- `packages/api/src/schemas/survey-send.ts` - NEW
- `packages/api/src/services/survey-send.ts` - NEW
- `apps/server/_source/routes/api-v1.ts` - NEW
- `apps/server/_source/jobs/handlers/survey-send.ts` - NEW
- `apps/server/_source/index.ts` - EXTEND with api-v1 router
- `tests/integration/survey-send-api.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 6: API Rate Limiting & Usage Metering]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/project-context.md#oRPC patterns]
- [Source: _bmad-output/implementation-artifacts/3-2-api-key-generation.md#Authentication patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
