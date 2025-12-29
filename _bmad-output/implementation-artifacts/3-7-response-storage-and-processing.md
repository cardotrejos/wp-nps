# Story 3.7: Response Storage and Processing

Status: ready-for-dev

## Story

As a **System**,
I want to **process and store responses in real-time**,
So that **analytics are immediately updated**.

## Acceptance Criteria

1. **Given** a response is received **When** it is stored **Then** the NPS score is categorized (0-6: Detractor, 7-8: Passive, 9-10: Promoter) **And** the response is linked to the delivery record

2. **Given** a response includes metadata **When** it is stored **Then** the metadata (order_id, customer_name) is preserved **And** it's available in the customer context

3. **Given** a new response is stored **When** the insert transaction commits **Then** `org_metrics` is updated in the SAME transaction (not async) **And** NPS score reflects the new response immediately (NFR-P5)

4. **Given** a response webhook is processed **When** matching a delivery **Then** the delivery status updates to "responded" **And** `responded_at` timestamp is set

5. **Given** a response with customer phone **When** stored **Then** it's linked to any existing customer record **Or** a new customer record is created

## Tasks / Subtasks

- [ ] Task 1: Create Survey Response Schema (AC: #1, #2)
  - [ ] 1.1 Add `survey_response` table to `packages/db/src/schema/flowpulse.ts`
  - [ ] 1.2 Define columns: id, org_id, survey_id, delivery_id, customer_id, score, category, feedback, metadata, created_at
  - [ ] 1.3 Add indexes for org_id, survey_id, category
  - [ ] 1.4 Run `bun db:push`

- [ ] Task 2: Create Customer Schema (AC: #5)
  - [ ] 2.1 Add `customer` table to schema
  - [ ] 2.2 Define columns: id, org_id, phone_number_hash, metadata, first_seen_at, last_seen_at
  - [ ] 2.3 Add unique constraint on (org_id, phone_number_hash)

- [ ] Task 3: Create Response Processing Service (AC: #1, #2, #4, #5)
  - [ ] 3.1 Create `packages/api/src/services/response-processor.ts`
  - [ ] 3.2 Implement `processResponse(params)` main function
  - [ ] 3.3 Categorize NPS score (detractor/passive/promoter)
  - [ ] 3.4 Find or create customer record
  - [ ] 3.5 Link response to delivery
  - [ ] 3.6 Update delivery status to "responded"

- [ ] Task 4: Create Metrics Update Service (AC: #3)
  - [ ] 4.1 Create `packages/api/src/services/metrics-updater.ts`
  - [ ] 4.2 Implement `updateOrgMetrics(orgId, response)` 
  - [ ] 4.3 Update NPS calculation incrementally
  - [ ] 4.4 Use SAME TRANSACTION as response insert

- [ ] Task 5: Create Response Job Handler (AC: #1, #4)
  - [ ] 5.1 Update `apps/server/_source/jobs/handlers/kapso-survey-response.ts`
  - [ ] 5.2 Parse response content for score
  - [ ] 5.3 Find matching delivery by customer phone
  - [ ] 5.4 Call response processor service

- [ ] Task 6: Write Tests (AC: #1, #2, #3, #4, #5)
  - [ ] 6.1 Create `tests/integration/response-processing.test.ts`
  - [ ] 6.2 Test NPS categorization
  - [ ] 6.3 Test metadata preservation
  - [ ] 6.4 Test metrics update in same transaction
  - [ ] 6.5 Test customer record creation
  - [ ] 6.6 Test delivery status update

## Dev Notes

### Critical Architecture Compliance

**This story implements FR26, NFR-P5 (real-time analytics), AR6 (pre-aggregated metrics).**

From architecture.md Decision 5 (Caching Strategy):
- `org_metrics` table for pre-aggregated dashboard metrics
- Application code updates metrics (not DB triggers)
- Same transaction for atomicity

### Previous Story Context

Story 3-6 established:
- Webhook receiver queues jobs for `kapso.message.received`
- Payload includes customerPhone, content, messageId

Story 3-3 established:
- `survey_delivery` table with customer phone and metadata

### NPS Categorization

```typescript
type NPSCategory = 'promoter' | 'passive' | 'detractor';

function categorizeNPS(score: number): NPSCategory {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}
```

### Survey Response Schema

```typescript
// packages/db/src/schema/flowpulse.ts
export const surveyResponse = pgTable('survey_response', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organization.id),
  surveyId: text('survey_id').notNull().references(() => survey.id),
  deliveryId: text('delivery_id').references(() => surveyDelivery.id),
  customerId: text('customer_id').references(() => customer.id),
  score: integer('score').notNull(),
  category: text('category').notNull(), // 'promoter' | 'passive' | 'detractor'
  feedback: text('feedback'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  isTest: boolean('is_test').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_survey_response_org').on(table.orgId),
  index('idx_survey_response_survey').on(table.surveyId),
  index('idx_survey_response_category').on(table.category),
  index('idx_survey_response_created').on(table.createdAt),
]);

export const customer = pgTable('customer', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organization.id),
  phoneNumberHash: text('phone_number_hash').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('uq_customer_org_phone').on(table.orgId, table.phoneNumberHash),
]);
```

### Response Processor Service

```typescript
// packages/api/src/services/response-processor.ts
import { createHash } from 'crypto';
import { db } from '@wp-nps/db';
import { surveyResponse, surveyDelivery, customer, survey } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateOrgMetrics } from './metrics-updater';

interface ProcessResponseParams {
  orgId: string;
  customerPhone: string;
  score: number;
  feedback: string | null;
  messageId: string;
}

type NPSCategory = 'promoter' | 'passive' | 'detractor';

function categorizeNPS(score: number): NPSCategory {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export async function processResponse(params: ProcessResponseParams): Promise<{ responseId: string }> {
  const { orgId, customerPhone, score, feedback, messageId } = params;
  const phoneHash = createHash('sha256').update(customerPhone).digest('hex');
  const category = categorizeNPS(score);
  
  // Use transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    // 1. Find or create customer
    let customerRecord = await tx.query.customer.findFirst({
      where: and(
        eq(customer.orgId, orgId),
        eq(customer.phoneNumberHash, phoneHash)
      ),
    });
    
    if (!customerRecord) {
      const [newCustomer] = await tx.insert(customer)
        .values({
          orgId,
          phoneNumberHash: phoneHash,
        })
        .returning();
      customerRecord = newCustomer;
    } else {
      // Update last seen
      await tx.update(customer)
        .set({ lastSeenAt: new Date() })
        .where(eq(customer.id, customerRecord.id));
    }
    
    // 2. Find matching delivery
    const delivery = await tx.query.surveyDelivery.findFirst({
      where: and(
        eq(surveyDelivery.orgId, orgId),
        eq(surveyDelivery.phoneNumberHash, phoneHash),
        eq(surveyDelivery.status, 'sent')
      ),
      orderBy: (d, { desc }) => desc(d.createdAt),
    });
    
    if (!delivery) {
      throw new Error('No matching delivery found for response');
    }
    
    // 3. Create response record
    const [response] = await tx.insert(surveyResponse)
      .values({
        orgId,
        surveyId: delivery.surveyId,
        deliveryId: delivery.id,
        customerId: customerRecord?.id,
        score,
        category,
        feedback,
        metadata: delivery.metadata,
        isTest: false,
      })
      .returning({ id: surveyResponse.id });
    
    // 4. Update delivery status
    await tx.update(surveyDelivery)
      .set({
        status: 'responded',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(surveyDelivery.id, delivery.id));
    
    // 5. Update org metrics (SAME TRANSACTION!)
    await updateOrgMetrics(tx, orgId, { score, category });
    
    return { responseId: response.id };
  });
}
```

### Metrics Updater Service

```typescript
// packages/api/src/services/metrics-updater.ts
import { db } from '@wp-nps/db';
import { orgMetrics } from '@wp-nps/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { Transaction } from '@wp-nps/db';

interface ResponseData {
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
}

export async function updateOrgMetrics(
  tx: Transaction | typeof db,
  orgId: string,
  response: ResponseData
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  // Update all-time NPS metrics using incremental calculation
  await tx.insert(orgMetrics)
    .values({
      orgId,
      metricType: 'nps_score',
      periodType: 'all_time',
      periodStart: null,
      value: response.score,
      sampleSize: 1,
    })
    .onConflictDoUpdate({
      target: [orgMetrics.orgId, orgMetrics.metricType, orgMetrics.periodType, orgMetrics.periodStart],
      set: {
        // Incremental average: new_avg = old_avg + (new_value - old_avg) / new_n
        value: sql`(${orgMetrics.value} * ${orgMetrics.sampleSize} + ${response.score}) / (${orgMetrics.sampleSize} + 1)`,
        sampleSize: sql`${orgMetrics.sampleSize} + 1`,
        updatedAt: new Date(),
      },
    });
  
  // Update category counts
  await tx.insert(orgMetrics)
    .values({
      orgId,
      metricType: `count_${response.category}`,
      periodType: 'all_time',
      periodStart: null,
      value: 1,
      sampleSize: 1,
    })
    .onConflictDoUpdate({
      target: [orgMetrics.orgId, orgMetrics.metricType, orgMetrics.periodType, orgMetrics.periodStart],
      set: {
        value: sql`${orgMetrics.value} + 1`,
        updatedAt: new Date(),
      },
    });
  
  // Update daily metrics
  await tx.insert(orgMetrics)
    .values({
      orgId,
      metricType: 'response_count',
      periodType: 'daily',
      periodStart: new Date(today),
      value: 1,
      sampleSize: 1,
    })
    .onConflictDoUpdate({
      target: [orgMetrics.orgId, orgMetrics.metricType, orgMetrics.periodType, orgMetrics.periodStart],
      set: {
        value: sql`${orgMetrics.value} + 1`,
        updatedAt: new Date(),
      },
    });
}
```

### Response Job Handler

```typescript
// apps/server/_source/jobs/handlers/kapso-survey-response.ts
import type { JobHandler, WebhookJob } from '@wp-nps/db/types';
import { parseSurveyResponse } from '@wp-nps/kapso/webhook-parser';
import { processResponse } from '@wp-nps/api/services/response-processor';
import { db } from '@wp-nps/db';
import { surveyDelivery } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';

interface KapsoMessagePayload {
  phoneNumberId: string;
  customerPhone: string;
  messageId: string;
  content: string;
}

export const kapsoSurveyResponseHandler: JobHandler = {
  eventType: 'kapso.message.received',
  
  async handle(job: WebhookJob) {
    const payload = job.payload as KapsoMessagePayload;
    const phoneHash = createHash('sha256').update(payload.customerPhone).digest('hex');
    
    // Find the most recent delivery to this customer
    const delivery = await db.query.surveyDelivery.findFirst({
      where: and(
        eq(surveyDelivery.orgId, job.orgId),
        eq(surveyDelivery.phoneNumberHash, phoneHash),
        eq(surveyDelivery.status, 'sent')
      ),
      with: {
        survey: true,
      },
      orderBy: (d, { desc }) => desc(d.createdAt),
    });
    
    if (!delivery) {
      console.log('No matching delivery found for response, ignoring message');
      return; // Not a survey response, ignore
    }
    
    // Parse the response content
    const surveyType = delivery.survey?.type as 'nps' | 'csat' | 'ces' ?? 'nps';
    const parsed = parseSurveyResponse(payload.content, surveyType);
    
    if (parsed.score === null) {
      console.log('Could not parse score from message, ignoring');
      return; // Couldn't parse a valid score
    }
    
    // Process the response
    await processResponse({
      orgId: job.orgId,
      customerPhone: payload.customerPhone,
      score: parsed.score,
      feedback: parsed.feedback,
      messageId: payload.messageId,
    });
  },
};
```

### Test Patterns

```typescript
// tests/integration/response-processing.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { db } from '@wp-nps/db';
import { survey, surveyDelivery, surveyResponse, customer, orgMetrics } from '@wp-nps/db/schema';
import { processResponse } from '@wp-nps/api/services/response-processor';
import { eq, and } from 'drizzle-orm';

describe('Response Processing', () => {
  let testOrg: { id: string };
  let testSurvey: { id: string };
  let testDelivery: { id: string };

  beforeEach(async () => {
    testOrg = await createTestOrg();
    
    const [s] = await db.insert(survey).values({
      orgId: testOrg.id,
      name: 'Test NPS',
      type: 'nps',
      status: 'active',
    }).returning();
    testSurvey = s;
    
    const [d] = await db.insert(surveyDelivery).values({
      orgId: testOrg.id,
      surveyId: testSurvey.id,
      phoneNumber: '+5511999999999',
      phoneNumberHash: 'testhash123',
      status: 'sent',
      metadata: { order_id: 'ORD-123' },
    }).returning();
    testDelivery = d;
  });

  it('categorizes NPS score correctly', async () => {
    const result = await processResponse({
      orgId: testOrg.id,
      customerPhone: '+5511999999999',
      score: 9,
      feedback: 'Great service!',
      messageId: 'msg-1',
    });
    
    const response = await db.query.surveyResponse.findFirst({
      where: eq(surveyResponse.id, result.responseId),
    });
    
    expect(response?.category).toBe('promoter');
    expect(response?.score).toBe(9);
  });

  it('preserves metadata from delivery', async () => {
    const result = await processResponse({
      orgId: testOrg.id,
      customerPhone: '+5511999999999',
      score: 7,
      feedback: null,
      messageId: 'msg-2',
    });
    
    const response = await db.query.surveyResponse.findFirst({
      where: eq(surveyResponse.id, result.responseId),
    });
    
    expect(response?.metadata).toEqual({ order_id: 'ORD-123' });
  });

  it('updates org_metrics in same transaction', async () => {
    // Get initial metrics
    const initialMetrics = await db.query.orgMetrics.findFirst({
      where: and(
        eq(orgMetrics.orgId, testOrg.id),
        eq(orgMetrics.metricType, 'nps_score'),
        eq(orgMetrics.periodType, 'all_time')
      ),
    });
    
    await processResponse({
      orgId: testOrg.id,
      customerPhone: '+5511999999999',
      score: 10,
      feedback: null,
      messageId: 'msg-3',
    });
    
    const updatedMetrics = await db.query.orgMetrics.findFirst({
      where: and(
        eq(orgMetrics.orgId, testOrg.id),
        eq(orgMetrics.metricType, 'nps_score'),
        eq(orgMetrics.periodType, 'all_time')
      ),
    });
    
    expect(updatedMetrics?.sampleSize).toBe((initialMetrics?.sampleSize ?? 0) + 1);
  });

  it('updates delivery status to responded', async () => {
    await processResponse({
      orgId: testOrg.id,
      customerPhone: '+5511999999999',
      score: 8,
      feedback: null,
      messageId: 'msg-4',
    });
    
    const delivery = await db.query.surveyDelivery.findFirst({
      where: eq(surveyDelivery.id, testDelivery.id),
    });
    
    expect(delivery?.status).toBe('responded');
    expect(delivery?.respondedAt).toBeDefined();
  });

  it('creates customer record if not exists', async () => {
    await processResponse({
      orgId: testOrg.id,
      customerPhone: '+5511888888888', // New phone
      score: 6,
      feedback: 'Could be better',
      messageId: 'msg-5',
    });
    
    const customers = await db.query.customer.findMany({
      where: eq(customer.orgId, testOrg.id),
    });
    
    expect(customers.length).toBeGreaterThanOrEqual(1);
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-P5 | NPS updates within 5s | Same-transaction update |
| AR6 | Pre-aggregated metrics | `org_metrics` table with incremental updates |

### Project Structure Notes

Files to create/modify:
- `packages/db/src/schema/flowpulse.ts` - ADD survey_response and customer tables
- `packages/api/src/services/response-processor.ts` - NEW
- `packages/api/src/services/metrics-updater.ts` - NEW
- `apps/server/_source/jobs/handlers/kapso-survey-response.ts` - UPDATE with full implementation
- `apps/server/_source/jobs/handlers/index.ts` - REGISTER handler
- `tests/integration/response-processing.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 5: Caching Strategy]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.7]
- [Source: _bmad-output/implementation-artifacts/3-6-kapso-webhook-receiver.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
