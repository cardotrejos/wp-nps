# Story 2.5: Test Survey on Myself

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Business Owner**,
I want to **send a test survey to my own WhatsApp**,
so that **I can experience the survey as my customers will**.

## Acceptance Criteria

1. **Given** I am on the survey edit page **When** I click "Send Test to Me" **Then** the survey is sent to my verified WhatsApp number **And** I see "Test sent! Check your WhatsApp" confirmation

2. **Given** I receive the test on my WhatsApp **When** I complete the survey **Then** the response is marked as "test" (not counted in analytics) **And** I can view the test response in the dashboard

3. **Given** my WhatsApp is not connected **When** I click "Send Test to Me" **Then** I see "Please connect WhatsApp first" with a link to connection settings

4. **Given** the send request fails **When** Kapso returns an error **Then** I see an error message with the failure reason **And** I can retry the send action

5. **Given** I am viewing the survey **When** I look at the test button **Then** I see a tooltip explaining what "Send Test to Me" does

## Tasks / Subtasks

- [x] Task 1: Create Survey Test Send Procedure (AC: #1, #3, #4)
  - [x] 1.1 Add `survey.sendTest` procedure to `packages/api/src/routers/survey.ts`
  - [x] 1.2 Accept `surveyId` as input
  - [x] 1.3 Validate survey belongs to current org (CRITICAL: multi-tenancy)
  - [x] 1.4 Fetch user's verified WhatsApp connection from `whatsapp_connection` table
  - [x] 1.5 If no active connection, throw error "WhatsApp not connected"
  - [x] 1.6 Call `KapsoClient.sendSurvey()` with test flag
  - [x] 1.7 Create `survey_delivery` record with `is_test = true`
  - [x] 1.8 Return delivery result with status

- [x] Task 2: Create survey_delivery Table Schema (AC: #1, #2)
  - [x] 2.1 Add `survey_delivery` table to `packages/db/src/schema/flowpulse.ts`
  - [x] 2.2 Include columns: id, org_id, survey_id, phone_number (encrypted), status, is_test, metadata, kapso_delivery_id
  - [x] 2.3 Include timestamps: created_at, updated_at, delivered_at
  - [x] 2.4 Add index on org_id for multi-tenancy queries
  - [x] 2.5 Add relations to survey and organization tables

- [x] Task 3: Add SendTestButton Component (AC: #1, #5)
  - [x] 3.1 Create `apps/web/src/components/surveys/send-test-button.tsx`
  - [x] 3.2 Display "Send Test to Me" button with icon
  - [x] 3.3 Add tooltip explaining the action
  - [x] 3.4 Show loading state during send
  - [x] 3.5 Disable button while sending

- [x] Task 4: Add useSendTestSurvey Mutation Hook (AC: #1, #4)
  - [x] 4.1 Add `useSendTestSurvey()` to `apps/web/src/hooks/use-surveys.ts`
  - [x] 4.2 Call `client.survey.sendTest({ surveyId })`
  - [x] 4.3 Handle success: show toast "Test sent! Check your WhatsApp"
  - [x] 4.4 Handle error: show toast with error message

- [x] Task 5: Integrate SendTestButton into Survey Edit Page (AC: #1)
  - [x] 5.1 Import SendTestButton into survey edit page
  - [x] 5.2 Add button to SurveyHeader actions area
  - [x] 5.3 Pass surveyId to SendTestButton

- [x] Task 6: Handle WhatsApp Not Connected State (AC: #3)
  - [x] 6.1 Check WhatsApp connection status before enabling button
  - [x] 6.2 Add `useWhatsAppConnection()` hook to check status
  - [x] 6.3 If not connected, show disabled state with message
  - [x] 6.4 Add link to WhatsApp connection settings

- [x] Task 7: Add isTest Flag Support to Response System (AC: #2)
  - [x] 7.1 Ensure survey_response table has `is_test` column (if not exists)
  - [x] 7.2 When processing test delivery response, set `is_test = true`
  - [x] 7.3 Dashboard queries should filter out `is_test = true` from analytics
  - [x] 7.4 Test responses should still be viewable in deliveries list

- [x] Task 8: Write Integration Tests (AC: #1, #2, #3, #4)
  - [x] 8.1 Test survey.sendTest sends to connected WhatsApp number
  - [x] 8.2 Test survey.sendTest creates delivery record with is_test = true
  - [x] 8.3 Test survey.sendTest enforces org isolation
  - [x] 8.4 Test survey.sendTest fails when WhatsApp not connected
  - [x] 8.5 Test KapsoMockClient is used (no real API calls)
  - [x] 8.6 Run all tests and verify passing

## Dev Notes

### Critical Architecture Compliance

**Survey Test Send Procedure (Multi-Tenancy Critical):**

```typescript
// packages/api/src/routers/survey.ts - ADD to existing router
import { protectedProcedure } from '../context';
import { z } from 'zod';
import { db } from '@wp-nps/db';
import { survey, whatsappConnection, surveyDelivery } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
import { getKapsoClient } from '../lib/kapso'; // Dependency injection pattern

// Add to surveyRouter
sendTest: protectedProcedure
  .input(z.object({
    surveyId: z.string(),
  }))
  .handler(async ({ context, input }) => {
    const orgId = context.session.activeOrganizationId;

    // Fetch survey with org filter (CRITICAL: multi-tenancy)
    const existingSurvey = await db.query.survey.findFirst({
      where: and(
        eq(survey.id, input.surveyId),
        eq(survey.orgId, orgId),
      ),
    });

    if (!existingSurvey) {
      throw new ORPCError({
        code: 'NOT_FOUND',
        message: 'Survey not found',
      });
    }

    // Fetch verified WhatsApp connection
    const connection = await db.query.whatsappConnection.findFirst({
      where: and(
        eq(whatsappConnection.orgId, orgId),
        eq(whatsappConnection.status, 'active'),
      ),
    });

    if (!connection) {
      throw new ORPCError({
        code: 'BAD_REQUEST',
        message: 'Please connect WhatsApp first',
      });
    }

    if (!connection.phoneNumber) {
      throw new ORPCError({
        code: 'BAD_REQUEST',
        message: 'WhatsApp connection missing phone number',
      });
    }

    // Get Kapso client (uses mock in tests)
    const kapsoClient = getKapsoClient();

    // Build survey message from questions
    const messageText = existingSurvey.questions
      .map((q: { text: string }) => q.text)
      .join('\n\n');

    // Send via Kapso
    const result = await kapsoClient.sendSurvey({
      phoneNumber: connection.phoneNumber,
      surveyId: input.surveyId,
      orgId,
      message: messageText,
      metadata: { isTest: true },
    });

    // Create delivery record
    await db.insert(surveyDelivery).values({
      orgId,
      surveyId: input.surveyId,
      phoneNumber: connection.phoneNumber, // Should be encrypted in production
      status: result.status,
      isTest: true,
      kapsoDeliveryId: result.deliveryId,
    });

    return {
      success: true,
      deliveryId: result.deliveryId,
      status: result.status,
    };
  }),
```

**survey_delivery Table Schema:**

```typescript
// packages/db/src/schema/flowpulse.ts - ADD
import { pgTable, text, boolean, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const surveyDelivery = pgTable(
  'survey_delivery',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    orgId: text('org_id').notNull().references(() => organization.id),
    surveyId: text('survey_id').notNull().references(() => survey.id),
    phoneNumber: text('phone_number').notNull(), // Should be encrypted
    status: text('status').notNull().default('pending'), // pending, queued, sent, delivered, failed
    isTest: boolean('is_test').notNull().default(false),
    metadata: jsonb('metadata'),
    kapsoDeliveryId: text('kapso_delivery_id'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deliveredAt: timestamp('delivered_at'),
  },
  (table) => [
    index('idx_survey_delivery_org_id').on(table.orgId),
    index('idx_survey_delivery_survey_id').on(table.surveyId),
  ]
);

export const surveyDeliveryRelations = relations(surveyDelivery, ({ one }) => ({
  organization: one(organization, {
    fields: [surveyDelivery.orgId],
    references: [organization.id],
  }),
  survey: one(survey, {
    fields: [surveyDelivery.surveyId],
    references: [survey.id],
  }),
}));
```

**SendTestButton Component:**

```typescript
// apps/web/src/components/surveys/send-test-button.tsx
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Send, Loader2 } from 'lucide-react';
import { useSendTestSurvey, useWhatsAppConnection } from '@/hooks/use-surveys';
import { Link } from '@tanstack/react-router';

interface SendTestButtonProps {
  surveyId: string;
}

export function SendTestButton({ surveyId }: SendTestButtonProps) {
  const { data: connection, isPending: isCheckingConnection } = useWhatsAppConnection();
  const sendTest = useSendTestSurvey();

  const isConnected = connection?.status === 'active';
  const isSending = sendTest.isPending;

  const handleSendTest = () => {
    if (!isConnected) return;
    sendTest.mutate({ surveyId });
  };

  if (isCheckingConnection) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button variant="outline" disabled>
                <Send className="h-4 w-4 mr-2" />
                Send Test to Me
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Please{' '}
              <Link to="/settings/whatsapp" className="underline">
                connect WhatsApp
              </Link>{' '}
              first
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleSendTest}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Test to Me
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send this survey to your WhatsApp to preview</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**useSendTestSurvey and useWhatsAppConnection Hooks:**

```typescript
// apps/web/src/hooks/use-surveys.ts - ADD to existing file
import { toast } from 'sonner';

export function useSendTestSurvey() {
  return useMutation({
    mutationFn: ({ surveyId }: { surveyId: string }) =>
      client.survey.sendTest({ surveyId }),
    onSuccess: () => {
      toast.success('Test sent! Check your WhatsApp');
    },
    onError: (error: Error) => {
      const message = error.message ?? 'Failed to send test';
      if (message.includes('connect WhatsApp')) {
        toast.error('Please connect WhatsApp first');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useWhatsAppConnection() {
  return useQuery({
    queryKey: ['whatsapp', 'connection'],
    queryFn: () => client.whatsapp.getConnection(),
    staleTime: 1000 * 60, // 1 minute
  });
}
```

**Kapso Client Dependency Injection:**

```typescript
// packages/api/src/lib/kapso.ts - CREATE
import type { IKapsoClient } from '@wp-nps/kapso';
import { KapsoMockClient } from '@wp-nps/kapso';

let kapsoClient: IKapsoClient | null = null;

export function getKapsoClient(): IKapsoClient {
  if (!kapsoClient) {
    // In tests, this will be the mock client
    // In production, this will be the real Kapso client
    // For MVP, we use mock - real client is Story 3.0
    kapsoClient = new KapsoMockClient();
  }
  return kapsoClient;
}

export function setKapsoClient(client: IKapsoClient): void {
  kapsoClient = client;
}

// For tests
export function resetKapsoClient(): void {
  kapsoClient = null;
}
```

### Previous Story Dependencies (Story 2.4 -> Story 2.5)

**From Story 2.4 (Preview Survey in WhatsApp Format):**

- Survey edit page has side-by-side layout (edit + preview)
- WhatsApp preview components exist (SurveyPreview, WhatsAppMessage, NPSRatingButtons)
- Preview updates reactively when questions change

**From Story 1.2/1.3 (WhatsApp Connection):**

- `whatsapp_connection` table exists with verified connections
- `whatsappConnection.status = 'active'` indicates verified connection
- `whatsappConnection.phoneNumber` stores user's WhatsApp number

**Kapso Package (from architecture):**

- `IKapsoClient` interface defined in `packages/kapso/src/types.ts`
- `KapsoMockClient` available for testing
- `sendSurvey()` method accepts phoneNumber, surveyId, orgId, message, metadata

### Project Structure Notes

**Files to Create:**

- `apps/web/src/components/surveys/send-test-button.tsx` - Test send button with tooltip
- `packages/api/src/lib/kapso.ts` - Kapso client factory with DI

**Files to Modify:**

- `packages/db/src/schema/flowpulse.ts` - Add surveyDelivery table
- `packages/api/src/routers/survey.ts` - Add sendTest procedure
- `apps/web/src/hooks/use-surveys.ts` - Add useSendTestSurvey and useWhatsAppConnection hooks
- `apps/web/src/routes/surveys.$surveyId.tsx` - Add SendTestButton to header
- `apps/web/src/components/surveys/survey-header.tsx` - Add SendTestButton slot

**Tests to Create:**

- `tests/integration/survey-send-test.test.ts` - Integration tests for sendTest procedure

### Testing Standards

**Integration Tests (using KapsoMockClient):**

```typescript
// tests/integration/survey-send-test.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@wp-nps/db';
import { survey, whatsappConnection, surveyDelivery } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { createTestOrg, cleanupTestData } from '../support/helpers/test-org';
import { KapsoMockClient } from '@wp-nps/kapso';
import { setKapsoClient, resetKapsoClient } from '@wp-nps/api/lib/kapso';

describe('Survey Send Test', () => {
  let kapsoMock: KapsoMockClient;

  beforeEach(async () => {
    await cleanupTestData();
    kapsoMock = new KapsoMockClient();
    setKapsoClient(kapsoMock);
  });

  afterEach(() => {
    resetKapsoClient();
  });

  it('sends test survey to connected WhatsApp number', async () => {
    const { org } = await createTestOrg('Test Corp');

    // Create active WhatsApp connection
    await db.insert(whatsappConnection).values({
      orgId: org.id,
      status: 'active',
      phoneNumber: '+5511999999999',
    });

    // Create survey
    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test NPS',
        type: 'nps',
        status: 'draft',
        questions: [{ id: 'q1', text: 'How likely?', type: 'rating', required: true }],
      })
      .returning();

    // Call sendTest (simulated)
    // In real test, this would call the procedure through oRPC

    // Verify Kapso was called with correct phone
    expect(kapsoMock.wasPhoneCalled('+5511999999999')).toBe(true);

    // Verify delivery record created with isTest = true
    const deliveries = await db.query.surveyDelivery.findMany({
      where: and(
        eq(surveyDelivery.surveyId, testSurvey.id),
        eq(surveyDelivery.isTest, true),
      ),
    });
    expect(deliveries).toHaveLength(1);
  });

  it('fails when WhatsApp not connected', async () => {
    const { org } = await createTestOrg('Test Corp');

    // No WhatsApp connection created

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test NPS',
        type: 'nps',
        status: 'draft',
        questions: [{ id: 'q1', text: 'How likely?', type: 'rating', required: true }],
      })
      .returning();

    // Expect error when calling sendTest
    // Error should be: "Please connect WhatsApp first"
  });

  it('enforces org isolation on send test', async () => {
    const { org: org1 } = await createTestOrg('Org 1');
    const { org: org2 } = await createTestOrg('Org 2');

    // Create survey for org1
    const [org1Survey] = await db.insert(survey)
      .values({
        orgId: org1.id,
        name: 'Org1 Survey',
        type: 'nps',
        status: 'draft',
        questions: [{ id: 'q1', text: 'Question', type: 'rating', required: true }],
      })
      .returning();

    // Try to send as org2 - should fail with NOT_FOUND
    // (not exposing that org1's survey exists)
  });

  it('uses KapsoMockClient, not real API', async () => {
    // Verify no real Kapso calls were made
    // kapsoMock should track all calls
    expect(kapsoMock.getCallHistory()).toHaveLength(0); // Before any sends

    // After sends, calls should be recorded in mock
  });
});
```

### Anti-Patterns to Avoid

```typescript
// WRONG: Not filtering by orgId when fetching WhatsApp connection
const connection = await db.query.whatsappConnection.findFirst({
  where: eq(whatsappConnection.status, 'active'), // MISSING orgId!
});

// CORRECT: Always include orgId filter
const connection = await db.query.whatsappConnection.findFirst({
  where: and(
    eq(whatsappConnection.orgId, orgId),
    eq(whatsappConnection.status, 'active'),
  ),
});

// WRONG: Using real Kapso client in tests
import { KapsoClient } from '@wp-nps/kapso'; // NO!

// CORRECT: Use mock client
import { KapsoMockClient } from '@wp-nps/kapso';

// WRONG: Not checking if WhatsApp is connected before sending
sendTest.mutate({ surveyId }); // What if not connected?

// CORRECT: Check connection status first (UI level) + backend validation
const { data: connection } = useWhatsAppConnection();
if (connection?.status !== 'active') {
  // Show connect message
}

// WRONG: Counting test responses in analytics
const responses = await db.query.surveyResponse.findMany({
  where: eq(surveyResponse.surveyId, surveyId), // Includes test responses!
});

// CORRECT: Filter out test responses
const responses = await db.query.surveyResponse.findMany({
  where: and(
    eq(surveyResponse.surveyId, surveyId),
    eq(surveyResponse.isTest, false), // Exclude tests
  ),
});

// WRONG: Not handling Kapso errors gracefully
const result = await kapsoClient.sendSurvey(params); // What if it throws?

// CORRECT: Handle errors and provide user feedback
try {
  const result = await kapsoClient.sendSurvey(params);
  return { success: true, deliveryId: result.deliveryId };
} catch (error) {
  if (error instanceof KapsoError) {
    throw new ORPCError({
      code: 'BAD_REQUEST',
      message: getHumanReadableError(error.code),
    });
  }
  throw error;
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5] Test Survey on Myself requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Kapso-Integration] AR2 interface abstraction
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing-Requirements] KapsoMockClient for tests
- [Source: _bmad-output/implementation-artifacts/2-4-preview-survey-in-whatsapp-format.md] Previous story context
- [Source: _bmad-output/project-context.md#Kapso-Mocking] Never real API calls in tests
- [Source: packages/kapso/src/types.ts] IKapsoClient interface
- [Source: packages/kapso/src/mock.ts] KapsoMockClient implementation

### Previous Story Intelligence

**From Story 2.4 (Preview Survey in WhatsApp Format) - Learnings:**

1. Survey edit page has SurveyHeader component in header area
2. Side-by-side layout exists for edit + preview
3. Survey data is fetched via useSurvey(surveyId) hook
4. Components follow kebab-case naming convention

**From Story 1.2/1.3 (WhatsApp Connection):**

1. `whatsapp_connection` table has: orgId, status, phoneNumber, kapsoId
2. Status values: 'pending', 'active', 'disconnected'
3. Phone number stored when connection is verified
4. `whatsapp.getConnection` procedure exists to check status

**Key Integration Points:**

- SendTestButton goes in SurveyHeader actions area
- Uses existing whatsapp router for connection status
- Uses KapsoMockClient for testing (real client in Story 3.0)
- Creates new survey_delivery table for tracking

### Connection to Story Sequence

**Story Flow in Epic 2:**

- 2.1 Survey Template Gallery - View and select templates
- 2.2 Create Survey from Template - Create survey, redirect to edit page
- 2.3 Edit Survey Question Text - Modify question text inline
- 2.4 Preview Survey in WhatsApp Format - See WhatsApp preview
- **2.5 Test Survey on Myself (THIS STORY)** - Send test via WhatsApp
- 2.6 Activate or Deactivate Survey - Control survey state
- 2.7 Set Survey Trigger Type - Configure API or manual trigger

**What Story 2.5 Enables:**

- Users can send a real WhatsApp survey to themselves
- Validates the end-to-end flow before going live
- Creates foundation for Survey Distribution (Epic 3)
- survey_delivery table will be used by all future sends

**Dependencies on Future Stories:**

- Story 3.0 (Kapso Integration Package) provides real KapsoClient
- Story 3.4 (Survey Delivery via Kapso) expands delivery functionality
- Story 3.6 (Kapso Webhook Receiver) processes responses

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (claude-sonnet-4-20250514)

### Debug Log References

- All 160 integration tests pass (including 11 new tests for Story 2.5)
- TypeScript type checking passes for all packages
- Database schema pushed to both development and test databases

### Completion Notes List

- Implemented survey test send procedure with full multi-tenancy enforcement using combined `and()` filter
- Created `survey_delivery` table with proper indexes for org_id and survey_id
- Added `is_test` column to `survey_response` table for analytics filtering
- Created `SendTestButton` component with tooltip and loading states
- Added `useSendTestSurvey` and `useWhatsAppConnection` hooks with proper toast notifications
- Integrated button into SurveyHeader replacing placeholder button
- Created Kapso client factory with dependency injection for testing
- All acceptance criteria validated through integration tests

### Change Log

- 2025-12-29: Story 2.5 implementation complete - all tasks finished, tests passing
- 2025-12-29: Code review completed - fixed misleading comments, added Kapso error handling, updated File List, removed obsolete Preview button

### File List

**New Files:**

- `packages/api/src/lib/kapso.ts` - Kapso client factory with DI for testing
- `apps/web/src/components/surveys/send-test-button.tsx` - SendTestButton component
- `apps/web/src/components/ui/tooltip.tsx` - shadcn tooltip component (added via CLI)
- `tests/integration/survey-send-test.test.ts` - 11 integration tests for Story 2.5

**Modified Files:**

- `packages/db/src/schema/flowpulse.ts` - Added survey_delivery table and surveyDeliveryRelations; Added is_test column to survey_response
- `packages/api/src/routers/survey.ts` - Added sendTest procedure with Kapso error handling
- `packages/api/package.json` - Added @wp-nps/kapso dependency and lib/\* export
- `apps/web/src/hooks/use-surveys.ts` - Added useSendTestSurvey, useWhatsAppConnection hooks and whatsappKeys
- `apps/web/src/components/surveys/survey-header.tsx` - Integrated SendTestButton
- `apps/web/src/routes/surveys.$surveyId.tsx` - Survey edit page (SendTestButton integration point)
- `apps/web/package.json` - Added tooltip component dependencies
- `tests/utils/test-org.ts` - Added survey_delivery cleanup
- `vitest.config.ts` - Added schema path aliases for test resolution
- `bun.lock` - Updated lockfile
