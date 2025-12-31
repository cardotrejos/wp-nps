# Story 2.7: Set Survey Trigger Type

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Business Owner**,
I want to **set how my survey will be triggered**,
So that **I can choose between API automation or manual sends**.

## Acceptance Criteria

1. **Given** I am on the survey settings page **When** I view trigger options **Then** I see "API Trigger" and "Manual Send" options **And** each option has a description of how it works

2. **Given** I select "API Trigger" **When** I save the setting **Then** the survey can be triggered via the REST API **And** I see API endpoint documentation inline

3. **Given** I select "Manual Send" **When** I save the setting **Then** I see a "Send Survey" button on the survey page **And** I can manually enter a phone number to send to

4. **Given** I am creating a new survey **When** I check the default trigger type **Then** it defaults to "API Trigger" (most common use case)

5. **Given** I change the trigger type **When** I save the setting **Then** I see a toast confirmation "Trigger type updated"

## Tasks / Subtasks

- [x] Task 1: Add triggerType Column to Survey Schema (AC: #1, #4)
  - [x] 1.1 Add `triggerType` column to survey table in `packages/db/src/schema/flowpulse.ts`
  - [x] 1.2 Column type: text with default 'api'
  - [x] 1.3 Valid values: 'api' | 'manual'
  - [x] 1.4 Run `bun db:push` to apply schema change

- [x] Task 2: Add Update Trigger Type Procedure (AC: #2, #3, #5)
  - [x] 2.1 Add `survey.updateTriggerType` procedure to `packages/api/src/routers/survey.ts`
  - [x] 2.2 Accept `surveyId` and `triggerType` ('api' | 'manual') as input
  - [x] 2.3 Validate survey belongs to current org (CRITICAL: multi-tenancy)
  - [x] 2.4 Update survey triggerType column
  - [x] 2.5 Return updated survey

- [x] Task 3: Create TriggerTypeSelector Component (AC: #1, #2, #3)
  - [x] 3.1 Create `apps/web/src/components/surveys/trigger-type-selector.tsx`
  - [x] 3.2 Display radio group with "API Trigger" and "Manual Send" options
  - [x] 3.3 Show description for each option
  - [x] 3.4 Highlight currently selected option
  - [x] 3.5 Auto-save on selection change

- [x] Task 4: Create ApiEndpointDisplay Component (AC: #2)
  - [x] 4.1 Create `apps/web/src/components/surveys/api-endpoint-display.tsx`
  - [x] 4.2 Show API endpoint URL for sending surveys
  - [x] 4.3 Include copy-to-clipboard button
  - [x] 4.4 Show minimal inline documentation (method, required params)

- [x] Task 5: Create ManualSendButton Component (AC: #3)
  - [x] 5.1 Create `apps/web/src/components/surveys/manual-send-button.tsx`
  - [x] 5.2 Display "Send Survey" button when triggerType is 'manual'
  - [x] 5.3 Opens modal/dialog for entering phone number
  - [x] 5.4 Validates phone number format
  - [x] 5.5 Calls survey send procedure (placeholder for Epic 3)

- [x] Task 6: Add useUpdateTriggerType Hook (AC: #5)
  - [x] 6.1 Add `useUpdateTriggerType()` to `apps/web/src/hooks/use-surveys.ts`
  - [x] 6.2 Call `client.survey.updateTriggerType({ surveyId, triggerType })`
  - [x] 6.3 Handle success: show toast "Trigger type updated"
  - [x] 6.4 Handle error: show toast with error message
  - [x] 6.5 Invalidate survey queries on success

- [x] Task 7: Integrate Components into Survey Edit Page (AC: #1, #2, #3)
  - [x] 7.1 Add TriggerTypeSelector to survey edit/settings section
  - [x] 7.2 Conditionally show ApiEndpointDisplay when triggerType is 'api'
  - [x] 7.3 Conditionally show ManualSendButton when triggerType is 'manual'
  - [x] 7.4 Pass survey data to components

- [x] Task 8: Write Integration Tests (AC: #2, #3, #4)
  - [x] 8.1 Test survey.updateTriggerType changes triggerType
  - [x] 8.2 Test survey.updateTriggerType enforces org isolation
  - [x] 8.3 Test survey.create defaults triggerType to 'api'
  - [x] 8.4 Test invalid triggerType values are rejected
  - [x] 8.5 Run all tests and verify passing

## Dev Notes

### Critical Architecture Compliance

**Schema Update for triggerType Column:**

```typescript
// packages/db/src/schema/flowpulse.ts - UPDATE survey table
export const survey = pgTable(
  "survey",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("nps"),
    status: text("status").notNull().default("draft"),
    triggerType: text("trigger_type").notNull().default("api"), // NEW: 'api' | 'manual'
    templateId: text("template_id").references(() => surveyTemplate.id),
    questions: jsonb("questions").$type<SurveyQuestion[]>().notNull().default([]),
    settings: jsonb("settings"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_survey_org_id").on(table.orgId),
    index("idx_survey_status").on(table.status),
  ],
);
```

**Update Trigger Type Procedure:**

```typescript
// packages/api/src/routers/survey.ts - ADD to existing router
import { protectedProcedure } from '../index';
import { z } from 'zod';
import { db } from '@wp-nps/db';
import { survey } from '@wp-nps/db/schema/flowpulse';
import { eq, and } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';

// Add to surveyRouter
updateTriggerType: protectedProcedure
  .input(z.object({
    surveyId: z.string(),
    triggerType: z.enum(['api', 'manual']),
  }))
  .handler(async ({ context, input }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'No active organization',
      });
    }

    // Fetch survey with org filter (CRITICAL: multi-tenancy)
    const existingSurvey = await db.query.survey.findFirst({
      where: and(
        eq(survey.id, input.surveyId),
        eq(survey.orgId, orgId),
      ),
    });

    if (!existingSurvey) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Survey not found',
      });
    }

    // Update trigger type
    const result = await db
      .update(survey)
      .set({
        triggerType: input.triggerType,
        updatedAt: new Date(),
      })
      .where(and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)))
      .returning();

    const updatedSurvey = result[0];
    if (!updatedSurvey) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update trigger type',
      });
    }

    return updatedSurvey;
  }),
```

**TriggerTypeSelector Component:**

```typescript
// apps/web/src/components/surveys/trigger-type-selector.tsx
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Hand } from 'lucide-react';
import { useUpdateTriggerType } from '@/hooks/use-surveys';

type TriggerType = 'api' | 'manual';

interface TriggerTypeSelectorProps {
  surveyId: string;
  currentType: TriggerType;
}

const triggerOptions: { value: TriggerType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'api',
    label: 'API Trigger',
    description: 'Automatically send surveys when triggered via REST API. Ideal for integrating with your existing systems.',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: 'manual',
    label: 'Manual Send',
    description: 'Manually send surveys by entering customer phone numbers. Perfect for targeted outreach.',
    icon: <Hand className="h-5 w-5" />,
  },
];

export function TriggerTypeSelector({ surveyId, currentType }: TriggerTypeSelectorProps) {
  const updateTriggerType = useUpdateTriggerType();

  const handleChange = (value: TriggerType) => {
    if (value !== currentType) {
      updateTriggerType.mutate({ surveyId, triggerType: value });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Survey Trigger</h3>
        <p className="text-sm text-muted-foreground">
          Choose how this survey will be triggered
        </p>
      </div>

      <RadioGroup
        value={currentType}
        onValueChange={handleChange}
        className="grid gap-4"
        disabled={updateTriggerType.isPending}
      >
        {triggerOptions.map((option) => (
          <Label
            key={option.value}
            htmlFor={option.value}
            className="cursor-pointer"
          >
            <Card className={currentType === option.value ? 'border-primary' : ''}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex items-center gap-2">
                  {option.icon}
                  <CardTitle className="text-base">{option.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{option.description}</CardDescription>
              </CardContent>
            </Card>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
```

**ApiEndpointDisplay Component:**

```typescript
// apps/web/src/components/surveys/api-endpoint-display.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ApiEndpointDisplayProps {
  surveyId: string;
}

export function ApiEndpointDisplay({ surveyId }: ApiEndpointDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Base URL would come from environment in production
  const baseUrl = import.meta.env.VITE_API_URL ?? 'https://api.flowpulse.app';
  const endpoint = `POST ${baseUrl}/api/v1/surveys/${surveyId}/send`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    toast.success('Endpoint copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">API Endpoint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-background p-2 text-sm font-mono">
            {endpoint}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Required body:</strong></p>
          <code className="block rounded bg-background p-2">
            {`{ "phoneNumber": "+5511999999999" }`}
          </code>
          <p><strong>Optional:</strong> metadata, customerName</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**ManualSendButton Component:**

```typescript
// apps/web/src/components/surveys/manual-send-button.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ManualSendButtonProps {
  surveyId: string;
  isActive: boolean;
}

export function ManualSendButton({ surveyId, isActive }: ManualSendButtonProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Phone validation (basic international format)
  const isValidPhone = /^\+\d{10,15}$/.test(phoneNumber);

  const handleSend = async () => {
    if (!isValidPhone) {
      toast.error('Please enter a valid phone number with country code (e.g., +5511999999999)');
      return;
    }

    setIsSending(true);

    try {
      // TODO: Call survey.sendManual procedure (Epic 3)
      // await client.survey.sendManual({ surveyId, phoneNumber });

      // For now, show placeholder success
      toast.success('Survey send functionality coming in Epic 3');
      setOpen(false);
      setPhoneNumber('');
    } catch (error) {
      toast.error('Failed to send survey');
    } finally {
      setIsSending(false);
    }
  };

  if (!isActive) {
    return (
      <Button variant="outline" disabled>
        <Send className="h-4 w-4 mr-2" />
        Activate to Send
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Send className="h-4 w-4 mr-2" />
          Send Survey
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Survey Manually</DialogTitle>
          <DialogDescription>
            Enter the customer's WhatsApp phone number to send this survey.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+5511999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              type="tel"
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +55 for Brazil)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isValidPhone || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**useUpdateTriggerType Hook:**

```typescript
// apps/web/src/hooks/use-surveys.ts - ADD to existing file
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useUpdateTriggerType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, triggerType }: { surveyId: string; triggerType: 'api' | 'manual' }) =>
      client.survey.updateTriggerType({ surveyId, triggerType }),
    onSuccess: (data) => {
      toast.success('Trigger type updated');
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['survey', data.id] });
    },
    onError: (error: Error) => {
      const message = error.message ?? 'Failed to update trigger type';
      toast.error(message);
    },
  });
}
```

### Previous Story Dependencies (Story 2.6 -> Story 2.7)

**From Story 2.6 (Activate or Deactivate Survey):**

- Survey has status column: 'draft', 'active', 'inactive'
- Survey has isActive boolean column
- SurveyStatusToggle component in header actions
- Mutation hook patterns established

**From Story 2.2 (Create Survey from Template):**

- Survey table structure established
- Survey is created with default values

**From Story 2.3 (Edit Survey Question Text):**

- Survey edit page exists at `/surveys/$surveyId`
- Settings/configuration section available

### Project Structure Notes

**Files to Create:**

- `apps/web/src/components/surveys/trigger-type-selector.tsx` - Radio group for trigger selection
- `apps/web/src/components/surveys/api-endpoint-display.tsx` - API endpoint with copy button
- `apps/web/src/components/surveys/manual-send-button.tsx` - Manual send dialog

**Files to Modify:**

- `packages/db/src/schema/flowpulse.ts` - Add triggerType column to survey table
- `packages/api/src/routers/survey.ts` - Add updateTriggerType procedure
- `apps/web/src/hooks/use-surveys.ts` - Add useUpdateTriggerType hook
- `apps/web/src/routes/surveys.$surveyId.tsx` - Add trigger type components

**Tests to Create:**

- `tests/integration/survey-trigger-type.test.ts` - Integration tests for trigger type procedures

### Testing Standards

**Integration Tests:**

```typescript
// tests/integration/survey-trigger-type.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@wp-nps/db';
import { survey } from '@wp-nps/db/schema/flowpulse';
import { eq, and } from 'drizzle-orm';
import { createTestOrg, cleanupTestData } from '../support/helpers/test-org';

describe('Survey Trigger Type', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it('updates trigger type to manual', async () => {
    const { org } = await createTestOrg('Test Corp');

    // Create survey with default api trigger
    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test Survey',
        type: 'nps',
        status: 'draft',
        triggerType: 'api', // Default
        questions: [{ id: 'q1', text: 'How likely?', type: 'rating', required: true }],
      })
      .returning();

    // Call updateTriggerType to 'manual'
    // Verify triggerType changed to 'manual'
  });

  it('updates trigger type to api', async () => {
    const { org } = await createTestOrg('Test Corp');

    // Create survey with manual trigger
    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Manual Survey',
        type: 'nps',
        status: 'draft',
        triggerType: 'manual',
        questions: [{ id: 'q1', text: 'How likely?', type: 'rating', required: true }],
      })
      .returning();

    // Call updateTriggerType to 'api'
    // Verify triggerType changed to 'api'
  });

  it('defaults triggerType to api on create', async () => {
    const { org } = await createTestOrg('Test Corp');

    // Create survey without explicit triggerType
    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Default Survey',
        type: 'nps',
        status: 'draft',
        questions: [],
      })
      .returning();

    // Verify triggerType is 'api'
    expect(testSurvey.triggerType).toBe('api');
  });

  it('enforces org isolation on trigger type update', async () => {
    const { org: org1 } = await createTestOrg('Org 1');
    const { org: org2 } = await createTestOrg('Org 2');

    // Create survey for org1
    const [org1Survey] = await db.insert(survey)
      .values({
        orgId: org1.id,
        name: 'Org1 Survey',
        type: 'nps',
        status: 'draft',
        triggerType: 'api',
        questions: [],
      })
      .returning();

    // Try to update as org2 - should fail with NOT_FOUND
  });

  it('rejects invalid trigger type values', async () => {
    const { org } = await createTestOrg('Test Corp');

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test Survey',
        type: 'nps',
        status: 'draft',
        questions: [],
      })
      .returning();

    // Try to update with invalid value like 'invalid' or 'webhook'
    // Should fail Zod validation
  });
});
```

### Anti-Patterns to Avoid

```typescript
// WRONG: Not defaulting triggerType in schema
triggerType: text("trigger_type"), // Missing default!

// CORRECT: Always provide default
triggerType: text("trigger_type").notNull().default("api"),

// WRONG: Accepting any string for triggerType
.input(z.object({
  triggerType: z.string(), // Too permissive!
}))

// CORRECT: Use enum validation
.input(z.object({
  triggerType: z.enum(['api', 'manual']),
}))

// WRONG: Not filtering by orgId when updating
await db.update(survey)
  .set({ triggerType: input.triggerType })
  .where(eq(survey.id, input.surveyId)); // MISSING orgId!

// CORRECT: Always include orgId filter
await db.update(survey)
  .set({ triggerType: input.triggerType })
  .where(and(eq(survey.id, input.surveyId), eq(survey.orgId, orgId)));

// WRONG: Showing API docs for manual trigger
{survey.triggerType === 'manual' && <ApiEndpointDisplay />}

// CORRECT: Conditionally show based on trigger type
{survey.triggerType === 'api' && <ApiEndpointDisplay surveyId={survey.id} />}
{survey.triggerType === 'manual' && <ManualSendButton surveyId={survey.id} />}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.7] Set Survey Trigger Type requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Multi-Tenancy] AR8, AR11 org filtering
- [Source: _bmad-output/implementation-artifacts/2-6-activate-or-deactivate-survey.md] Previous story context
- [Source: _bmad-output/project-context.md#oRPC-Patterns] Handler patterns and error handling
- [Source: packages/db/src/schema/flowpulse.ts] Survey table schema
- [Source: packages/api/src/routers/survey.ts] Existing survey router patterns

### Previous Story Intelligence

**From Story 2.6 (Activate or Deactivate Survey) - Learnings:**

1. Status toggle component pattern established
2. Mutation hooks with query invalidation
3. Toast feedback for user actions
4. Card-based UI for settings

**From Story 2.5 (Test Survey on Myself):**

1. Phone number validation patterns
2. Dialog component for user input
3. Loading states during async operations

**Key Integration Points:**

- TriggerTypeSelector added to survey settings/edit section
- ApiEndpointDisplay shown conditionally when triggerType is 'api'
- ManualSendButton shown conditionally when triggerType is 'manual'
- Follows existing mutation hook patterns

### Connection to Story Sequence

**Story Flow in Epic 2:**

- 2.1 Survey Template Gallery - View and select templates
- 2.2 Create Survey from Template - Create survey, redirect to edit page
- 2.3 Edit Survey Question Text - Modify question text inline
- 2.4 Preview Survey in WhatsApp Format - See WhatsApp preview
- 2.5 Test Survey on Myself - Send test via WhatsApp
- 2.6 Activate or Deactivate Survey - Control survey state
- **2.7 Set Survey Trigger Type (THIS STORY)** - Configure API or manual trigger

**What Story 2.7 Enables:**

- Users can configure how surveys will be triggered
- API trigger prepares for Epic 3 API endpoint story
- Manual trigger provides simple send UI for non-technical users
- Completes Epic 2 (Survey Creation & Management)

**Dependencies on Future Stories:**

- Story 3.3 (Survey Send API Endpoint) - Uses triggerType to validate API sends
- Story 3.10 (Manual Survey Send UI) - Expands manual send functionality

**Epic 2 Completion:**

This is the final story in Epic 2. After implementation:

- All 7 Epic 2 stories will be complete
- Users can create, customize, preview, test, activate, and configure surveys
- Epic 3 (Survey Distribution) can begin

## Dev Agent Record

### Agent Model Used

Claude 4 (Sonnet)

### Debug Log References

- Pushed schema to test database: `DATABASE_URL="postgresql://postgres:password@localhost:5433/wp-nps-test" bunx drizzle-kit push`

### Completion Notes List

- Added `triggerType` column to survey schema with default 'api'
- Created `survey.updateTriggerType` procedure with multi-tenancy enforcement
- Created TriggerTypeSelector component with radio group UI
- Created ApiEndpointDisplay component with copy-to-clipboard functionality
- Created ManualSendButton component with phone number validation
- Added `useUpdateTriggerType` hook with toast notifications
- Integrated all components into survey edit page (`apps/web/src/routes/surveys.$surveyId.tsx`)
- Added shadcn/ui radio-group and dialog components
- Created comprehensive integration tests (13 tests, all passing)
- Fixed existing test file to include triggerType in mock survey

### Change Log

- 2025-12-29: Implemented Story 2.7 - Set Survey Trigger Type
  - Schema: Added triggerType column (default: 'api')
  - API: Added updateTriggerType procedure
  - UI: Created 3 new components for trigger type selection
  - Tests: 13 new integration tests, 190 total tests passing

- 2025-12-29: Code Review Fixes (AI)
  - Added Zod schema validation tests (7 new tests for Task 8.4)
  - Added "Coming Soon" indicators to ApiEndpointDisplay and ManualSendButton
  - Improved ManualSendButton UX with clearer placeholder state
  - Added unit tests for trigger type components
  - Updated File List with all modified files

### File List

**Created:**

- apps/web/src/components/surveys/trigger-type-selector.tsx
- apps/web/src/components/surveys/api-endpoint-display.tsx
- apps/web/src/components/surveys/manual-send-button.tsx
- apps/web/src/components/surveys/**tests**/trigger-type-components.test.tsx
- apps/web/src/components/ui/radio-group.tsx
- apps/web/src/components/ui/dialog.tsx
- tests/integration/survey-trigger-type.test.ts

**Modified:**

- packages/db/src/schema/flowpulse.ts (added triggerType column)
- packages/api/src/routers/survey.ts (added updateTriggerType procedure)
- apps/web/src/hooks/use-surveys.ts (added useUpdateTriggerType hook)
- apps/web/src/routes/surveys.$surveyId.tsx (integrated trigger type components)
- apps/web/src/components/surveys/**tests**/survey-preview.test.tsx (fixed mock to include triggerType)
- apps/web/src/components/ui/button.tsx (updated by shadcn)
- tests/utils/test-org.ts (added survey_delivery cleanup)
- vitest.config.ts (added path aliases for component tests)
- apps/web/package.json (shadcn/ui dependencies)
- bun.lock (dependency updates)
