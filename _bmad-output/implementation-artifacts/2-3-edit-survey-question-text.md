# Story 2.3: Edit Survey Question Text

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Business Owner**,
I want to **edit the question text in my survey**,
so that **I can customize the wording for my brand**.

## Acceptance Criteria

1. **Given** I am on the survey edit page **When** I click on a question text field **Then** I can edit the question text inline **And** changes are auto-saved after 2 seconds of inactivity

2. **Given** I edit the NPS question text **When** I change "How likely are you to recommend us?" to "How likely are you to recommend [Brand Name]?" **Then** the updated text is saved **And** I see a "Saved" indicator

3. **Given** I try to save an empty question **When** I delete all text and blur the field **Then** I see a validation error "Question text is required" **And** the empty value is not saved

4. **Given** I am editing a question **When** I type new text **Then** I see a "Saving..." indicator during the debounce period **And** the indicator changes to "Saved" after successful save

5. **Given** the save request fails **When** a network error occurs **Then** I see an error indicator **And** I can retry the save action

## Tasks / Subtasks

- [x] Task 1: Add Survey Update Question Procedure (AC: #1, #2, #3, #5)
  - [x] 1.1 Add `survey.updateQuestion` to `packages/api/src/routers/survey.ts`
  - [x] 1.2 Accept `surveyId`, `questionId`, and `text` as required inputs
  - [x] 1.3 Validate survey belongs to current org (CRITICAL: multi-tenancy)
  - [x] 1.4 Validate question text is non-empty via Zod `.min(1)`
  - [x] 1.5 Update question text in the questions JSONB array
  - [x] 1.6 Return updated survey with all questions
  - [x] 1.7 Throw NOT_FOUND if survey doesn't exist or wrong org
  - [x] 1.8 Throw BAD_REQUEST if question not found in survey

- [x] Task 2: Create useDebounce Hook (AC: #1, #4)
  - [x] 2.1 Create `apps/web/src/hooks/use-debounce.ts`
  - [x] 2.2 Implement generic debounce with configurable delay
  - [x] 2.3 Return debounced value

- [x] Task 3: Add useUpdateQuestion Mutation Hook (AC: #1, #4, #5)
  - [x] 3.1 Add `useUpdateQuestion()` to `apps/web/src/hooks/use-surveys.ts`
  - [x] 3.2 Configure optimistic update for immediate UI feedback
  - [x] 3.3 Configure query invalidation for `surveyKeys.detail(surveyId)`
  - [x] 3.4 Return mutation state for save indicator UI

- [x] Task 4: Modify QuestionCard for Inline Editing (AC: #1, #2, #4)
  - [x] 4.1 Update `apps/web/src/components/surveys/question-card.tsx`
  - [x] 4.2 Accept `surveyId` as prop (pass from parent)
  - [x] 4.3 Add controlled textarea with local state
  - [x] 4.4 Implement 2-second debounce for auto-save
  - [x] 4.5 Add save status indicator (Saved/Saving.../Error)
  - [x] 4.6 Handle blur event to trigger save

- [x] Task 5: Update QuestionList to Pass surveyId (AC: #1)
  - [x] 5.1 Modify `apps/web/src/components/surveys/question-list.tsx`
  - [x] 5.2 Accept `surveyId` as required prop
  - [x] 5.3 Pass `surveyId` to each QuestionCard

- [x] Task 6: Update Survey Edit Page (AC: #1)
  - [x] 6.1 Modify `apps/web/src/routes/surveys.$surveyId.tsx`
  - [x] 6.2 Pass `surveyId` to QuestionList component

- [x] Task 7: Add Validation UI Feedback (AC: #3)
  - [x] 7.1 Show inline error when text is empty
  - [x] 7.2 Prevent save when validation fails
  - [x] 7.3 Clear error when user starts typing valid text
  - [x] 7.4 Style error state with red border and message

- [x] Task 8: Add Retry Mechanism for Failed Saves (AC: #5)
  - [x] 8.1 Show retry button on save failure
  - [x] 8.2 Store pending changes in local state
  - [x] 8.3 Retry with stored changes on button click
  - [x] 8.4 Clear error state on successful retry

- [x] Task 9: Write Integration Tests (AC: #1, #2, #3, #5)
  - [x] 9.1 Test survey.updateQuestion updates question text correctly
  - [x] 9.2 Test survey.updateQuestion enforces org isolation
  - [x] 9.3 Test survey.updateQuestion rejects empty text
  - [x] 9.4 Test survey.updateQuestion returns NOT_FOUND for wrong org
  - [x] 9.5 Test survey.updateQuestion returns BAD_REQUEST for invalid questionId
  - [x] 9.6 Test survey.updateQuestion preserves other question fields
  - [x] 9.7 Run all tests and verify passing

## Dev Notes

### Critical Architecture Compliance

**Survey Update Question Procedure (Multi-Tenancy Critical):**

```typescript
// packages/api/src/routers/survey.ts - ADD to existing router
import { protectedProcedure } from '../context';
import { z } from 'zod';
import { db } from '@wp-nps/db';
import { survey } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
import type { SurveyQuestion } from '@wp-nps/db/schema';

// Add to surveyRouter
updateQuestion: protectedProcedure
  .input(z.object({
    surveyId: z.string(),
    questionId: z.string(),
    text: z.string().min(1, 'Question text is required'),
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

    // Find and update the question
    const questions = existingSurvey.questions as SurveyQuestion[];
    const questionIndex = questions.findIndex(q => q.id === input.questionId);

    if (questionIndex === -1) {
      throw new ORPCError({
        code: 'BAD_REQUEST',
        message: 'Question not found in survey',
      });
    }

    // Update question text (preserve other fields)
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      text: input.text,
    };

    // Save updated questions
    const [updatedSurvey] = await db.update(survey)
      .set({
        questions: updatedQuestions,
        updatedAt: new Date(),
      })
      .where(and(
        eq(survey.id, input.surveyId),
        eq(survey.orgId, orgId), // Double-check org isolation
      ))
      .returning();

    if (!updatedSurvey) {
      throw new ORPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update survey',
      });
    }

    return updatedSurvey;
  }),
```

**useDebounce Hook:**

```typescript
// apps/web/src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**useUpdateQuestion Mutation Hook:**

```typescript
// apps/web/src/hooks/use-surveys.ts - ADD to existing file
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, questionId, text }: {
      surveyId: string;
      questionId: string;
      text: string;
    }) => client.survey.updateQuestion({ surveyId, questionId, text }),
    onSuccess: (updatedSurvey) => {
      // Update the cache with the new survey data
      queryClient.setQueryData(
        surveyKeys.detail(updatedSurvey.id),
        updatedSurvey
      );
    },
  });
}
```

**Updated QuestionCard Component with Inline Editing:**

```typescript
// apps/web/src/components/surveys/question-card.tsx
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useUpdateQuestion } from '@/hooks/use-surveys';
import { cn } from '@/lib/utils';
import type { SurveyQuestion } from '@wp-nps/db/schema';

interface QuestionCardProps {
  surveyId: string;
  question: SurveyQuestion;
  index: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function QuestionCard({ surveyId, question, index }: QuestionCardProps) {
  const [text, setText] = useState(question.text);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const debouncedText = useDebounce(text, 2000);

  const updateQuestion = useUpdateQuestion();

  // Auto-save when debounced text changes
  useEffect(() => {
    // Skip if text hasn't changed from original
    if (debouncedText === question.text) return;

    // Validate
    if (!debouncedText.trim()) {
      setError('Question text is required');
      return;
    }

    setError(null);
    setSaveStatus('saving');

    updateQuestion.mutate(
      { surveyId, questionId: question.id, text: debouncedText },
      {
        onSuccess: () => setSaveStatus('saved'),
        onError: () => setSaveStatus('error'),
      }
    );
  }, [debouncedText, surveyId, question.id, question.text, updateQuestion]);

  // Show "Saving..." indicator while typing (before debounce completes)
  useEffect(() => {
    if (text !== question.text && text.trim()) {
      setSaveStatus('saving');
    }
  }, [text, question.text]);

  // Reset saved status after 2 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleRetry = useCallback(() => {
    if (!text.trim()) return;

    setSaveStatus('saving');
    updateQuestion.mutate(
      { surveyId, questionId: question.id, text },
      {
        onSuccess: () => setSaveStatus('saved'),
        onError: () => setSaveStatus('error'),
      }
    );
  }, [surveyId, question.id, text, updateQuestion]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Immediate validation feedback
    if (!newText.trim()) {
      setError('Question text is required');
    } else {
      setError(null);
    }
  };

  return (
    <Card className={cn(error && 'border-destructive')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Question {index}</span>
          <div className="flex items-center gap-2">
            {/* Save Status Indicator */}
            {saveStatus === 'saving' && (
              <span className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center text-sm text-green-600">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1">
                <span className="flex items-center text-sm text-destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="h-6 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </span>
            )}

            <Badge variant="outline">
              {question.type === 'rating' ? 'Rating' : 'Text'}
            </Badge>
            {question.required && (
              <Badge variant="secondary">Required</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={handleChange}
          placeholder="Enter question text..."
          className={cn(
            'min-h-[80px] resize-none',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
        {question.type === 'rating' && question.scale && (
          <p className="text-sm text-muted-foreground mt-2">
            Scale: {question.scale.min} - {question.scale.max}
            {question.scale.labels && (
              <span> ({question.scale.labels.min} to {question.scale.labels.max})</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Updated QuestionList Component (pass surveyId):**

```typescript
// apps/web/src/components/surveys/question-list.tsx - MODIFY
import { cn } from '@/lib/utils';
import { QuestionCard } from './question-card';
import type { SurveyQuestion } from '@wp-nps/db/schema';

interface QuestionListProps {
  surveyId: string; // ADD this prop
  questions: SurveyQuestion[];
  className?: string;
}

export function QuestionList({ surveyId, questions, className }: QuestionListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="text-lg font-semibold">Questions</h2>
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          surveyId={surveyId} // PASS surveyId
          question={question}
          index={index + 1}
        />
      ))}
    </div>
  );
}
```

**Updated Survey Edit Page:**

```typescript
// apps/web/src/routes/surveys.$surveyId.tsx - MODIFY
// In the return statement, update the QuestionList call:
<QuestionList
  surveyId={surveyId}  // ADD this
  questions={survey.questions}
  className="mt-8"
/>
```

### Previous Story Dependencies (Story 2.2 -> Story 2.3)

**From Story 2.2 (Create Survey from Template):**

- Survey edit page at `/surveys/$surveyId` (route: `surveys.$surveyId.tsx`)
- `SurveyHeader` component displays name, type, status badges
- `QuestionList` component displays questions in order (READ-ONLY - to be modified)
- `QuestionCard` component displays question (READ-ONLY - to be modified)
- `useSurvey(surveyId)` hook fetches survey data
- `survey.getById` procedure with org isolation
- `survey.create` procedure

**Infrastructure to EXTEND (not recreate):**

```typescript
// From Story 2.2 - ADD updateQuestion to this:
// packages/api/src/routers/survey.ts
export const surveyRouter = {
  list: protectedProcedure..., // From 2.1
  create: protectedProcedure..., // From 2.2
  getById: protectedProcedure..., // From 2.1
  updateQuestion: protectedProcedure..., // ADD THIS
};
```

**Survey Questions Schema (from Story 2.1):**

```typescript
// The questions field is JSONB with this structure:
type SurveyQuestion = {
  id: string;
  text: string;
  type: 'rating' | 'text';
  scale?: {
    min: number;
    max: number;
    labels?: { min: string; max: string };
  };
  required: boolean;
};
```

### Project Structure Notes

**Files to Create:**

- `apps/web/src/hooks/use-debounce.ts` - Debounce utility hook

**Files to Modify:**

- `packages/api/src/routers/survey.ts` - Add `updateQuestion` procedure
- `apps/web/src/hooks/use-surveys.ts` - Add `useUpdateQuestion` mutation hook
- `apps/web/src/components/surveys/question-card.tsx` - Add inline editing capability
- `apps/web/src/components/surveys/question-list.tsx` - Pass surveyId to QuestionCard
- `apps/web/src/routes/surveys.$surveyId.tsx` - Pass surveyId to QuestionList

**Tests to Create:**

- `tests/integration/survey-update-question.test.ts` - Integration tests for updateQuestion

### Testing Standards

**Integration Tests:**

```typescript
// tests/integration/survey-update-question.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@wp-nps/db';
import { survey } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { createTestOrg, cleanupTestData } from '../support/helpers/test-org';

describe('Survey Update Question', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it('updates question text correctly', async () => {
    const { org } = await createTestOrg('Test Corp');

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test Survey',
        type: 'nps',
        status: 'draft',
        questions: [
          { id: 'q1', text: 'Original question?', type: 'rating', required: true, scale: { min: 0, max: 10 } },
        ],
      })
      .returning();

    // Simulate update
    const updatedQuestions = testSurvey.questions.map(q =>
      q.id === 'q1' ? { ...q, text: 'Updated question?' } : q
    );

    const [updated] = await db.update(survey)
      .set({ questions: updatedQuestions })
      .where(and(eq(survey.id, testSurvey.id), eq(survey.orgId, org.id)))
      .returning();

    expect(updated.questions[0].text).toBe('Updated question?');
  });

  it('enforces org isolation on update', async () => {
    const { org: org1 } = await createTestOrg('Org 1');
    const { org: org2 } = await createTestOrg('Org 2');

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org1.id,
        name: 'Org1 Survey',
        type: 'nps',
        status: 'draft',
        questions: [{ id: 'q1', text: 'Question?', type: 'rating', required: true }],
      })
      .returning();

    // Try to find as org2 - should not find survey
    const found = await db.query.survey.findFirst({
      where: and(
        eq(survey.id, testSurvey.id),
        eq(survey.orgId, org2.id), // Wrong org!
      ),
    });

    expect(found).toBeNull();
  });

  it('preserves other question fields when updating text', async () => {
    const { org } = await createTestOrg('Test Corp');

    const originalQuestion = {
      id: 'q1',
      text: 'Original',
      type: 'rating' as const,
      required: true,
      scale: { min: 0, max: 10, labels: { min: 'Not likely', max: 'Very likely' } },
    };

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test Survey',
        type: 'nps',
        status: 'draft',
        questions: [originalQuestion],
      })
      .returning();

    const updatedQuestions = testSurvey.questions.map(q =>
      q.id === 'q1' ? { ...q, text: 'New text' } : q
    );

    const [updated] = await db.update(survey)
      .set({ questions: updatedQuestions })
      .where(eq(survey.id, testSurvey.id))
      .returning();

    expect(updated.questions[0].text).toBe('New text');
    expect(updated.questions[0].type).toBe('rating');
    expect(updated.questions[0].required).toBe(true);
    expect(updated.questions[0].scale).toEqual(originalQuestion.scale);
  });

  it('returns error for non-existent question', async () => {
    const { org } = await createTestOrg('Test Corp');

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org.id,
        name: 'Test Survey',
        type: 'nps',
        status: 'draft',
        questions: [{ id: 'q1', text: 'Question?', type: 'rating', required: true }],
      })
      .returning();

    const questionIndex = testSurvey.questions.findIndex(q => q.id === 'nonexistent');

    expect(questionIndex).toBe(-1);
  });

  it('does not update survey from different org', async () => {
    const { org: org1 } = await createTestOrg('Org 1');
    const { org: org2 } = await createTestOrg('Org 2');

    const [testSurvey] = await db.insert(survey)
      .values({
        orgId: org1.id,
        name: 'Org1 Survey',
        type: 'nps',
        status: 'draft',
        questions: [{ id: 'q1', text: 'Original', type: 'rating', required: true }],
      })
      .returning();

    // Try to update as org2 - should update 0 rows
    const result = await db.update(survey)
      .set({ questions: [{ id: 'q1', text: 'Hacked!', type: 'rating', required: true }] })
      .where(and(
        eq(survey.id, testSurvey.id),
        eq(survey.orgId, org2.id), // Wrong org!
      ))
      .returning();

    expect(result).toHaveLength(0);

    // Verify original is unchanged
    const original = await db.query.survey.findFirst({
      where: eq(survey.id, testSurvey.id),
    });
    expect(original?.questions[0].text).toBe('Original');
  });
});
```

### UX Guidelines

**Inline Editing Experience:**

- Click on question text to start editing (textarea becomes active)
- Text changes are auto-saved after 2 seconds of inactivity
- Show "Saving..." indicator during debounce period
- Show green "Saved" checkmark briefly after successful save (2s then fade)
- Show red error state with retry button on failure

**Visual Feedback:**

- Default: No indicator (question text is editable)
- Typing: "Saving..." with spinner appears
- Saved: Green "Saved" checkmark (fades after 2s)
- Error: Red "Error" with retry button

**Validation:**

- Empty text shows red border and error message immediately
- Save is blocked until valid text entered
- Error clears immediately when user types valid text

**Keyboard Support:**

- Tab to navigate between questions
- Enter does NOT submit (allows multi-line if needed)
- Standard textarea keyboard behaviors

### Anti-Patterns to Avoid

```typescript
// WRONG: Not filtering by orgId when updating
await db.update(survey)
  .set({ questions: updatedQuestions })
  .where(eq(survey.id, input.surveyId)); // MISSING orgId filter!

// WRONG: Mutating the original questions array
existingSurvey.questions[questionIndex].text = input.text; // DON'T mutate!

// WRONG: Not preserving other question fields
updatedQuestions[questionIndex] = { text: input.text }; // Lost type, scale, required!

// WRONG: Not handling save failure in UI
updateQuestion.mutate({ ... }); // No onError handler!

// WRONG: Using uncontrolled input for editable text
<textarea defaultValue={question.text} /> // Use controlled state!

// WRONG: Immediate save on every keystroke (no debounce)
onChange={(e) => updateQuestion.mutate({ text: e.target.value })} // Too many API calls!

// WRONG: Not using and() for multi-tenancy
where: eq(survey.id, input.surveyId) // MUST also check orgId!
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3] Edit Survey Question Text requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Multi-Tenancy] orgId enforcement patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#oRPC-Patterns] Direct data returns
- [Source: _bmad-output/implementation-artifacts/2-2-create-survey-from-template.md] Previous story context
- [Source: _bmad-output/project-context.md#TanStack-Query] useMutation patterns
- [Source: _bmad-output/project-context.md#Critical-Rules] Anti-patterns to avoid

### Previous Story Intelligence

**From Story 2.2 (Create Survey from Template) - Learnings:**

1. Route pattern is flat files (`surveys.$surveyId.tsx`), not nested folders
2. `useSurvey(surveyId)` hook already exists for fetching single survey
3. `SurveyHeader` and `QuestionCard` components are already created
4. Error handling uses `toast.error()` from sonner
5. Multi-tenancy uses combined `and()` filter pattern
6. Tests verify IDOR prevention explicitly

**Key Extension Points:**

- Modify existing `QuestionCard` (don't recreate)
- Add `useUpdateQuestion` to existing hooks file
- Add `survey.updateQuestion` to existing router

**Code Review Fixes from Story 2.2 (apply same patterns):**

- Always use combined `and()` filter for orgId + id
- Add null check for database operation results
- Include tests for IDOR prevention

### Connection to Story Sequence

**Story Flow in Epic 2:**

- 2.1 Survey Template Gallery - View and select templates
- 2.2 Create Survey from Template - Create survey, redirect to edit page
- **2.3 Edit Survey Question Text (THIS STORY)** - Modify question text inline
- 2.4 Preview Survey in WhatsApp Format - See WhatsApp preview
- 2.5 Test Survey on Myself - Send test via WhatsApp
- 2.6 Activate or Deactivate Survey - Control survey state
- 2.7 Set Survey Trigger Type - Configure API or manual trigger

**What Story 2.3 Enables:**

- Users can customize template questions for their brand
- Foundation for Story 2.4 (preview will show edited questions)
- Foundation for Story 2.5 (test will send edited questions)

## Dev Agent Record

### Agent Model Used

Claude (claude-sonnet-4-20250514)

### Debug Log References

### Completion Notes List

- All 9 tasks completed successfully
- 13 integration tests passing for survey.updateQuestion
- Type checks pass
- Multi-tenancy enforced with combined and() filter pattern
- Code review completed: 4 MEDIUM issues fixed

### Change Log

- 2025-12-27: Implemented Story 2.3 - Edit Survey Question Text
  - Added `survey.updateQuestion` procedure with multi-tenancy support
  - Created `useDebounce` hook for auto-save
  - Added `useUpdateQuestion` mutation hook
  - Modified QuestionCard with inline editing, validation, save indicators, and retry
  - Updated QuestionList and Survey Edit Page to pass surveyId
  - Created 13 integration tests (all passing)

- 2025-12-27: Code Review Fixes Applied
  - Fix #1: Implemented true optimistic update with `onMutate` for immediate UI feedback
  - Fix #2: Added `onError` handler with cache rollback in `useUpdateQuestion`
  - Fix #3: Refactored to use stable `saveQuestion` callback to fix exhaustive-deps issue
  - Fix #4: Added `onBlur` handler to trigger immediate save when leaving field (AC #3)

### File List

**Created:**

- `apps/web/src/hooks/use-debounce.ts` - Debounce utility hook
- `apps/web/src/components/ui/textarea.tsx` - shadcn Textarea component
- `tests/integration/survey-update-question.test.ts` - 13 integration tests

**Modified:**

- `packages/api/src/routers/survey.ts` - Added updateQuestion procedure
- `apps/web/src/hooks/use-surveys.ts` - Added useUpdateQuestion mutation
- `apps/web/src/components/surveys/question-card.tsx` - Inline editing with debounce
- `apps/web/src/components/surveys/question-list.tsx` - Added surveyId prop
- `apps/web/src/routes/surveys.$surveyId.tsx` - Pass surveyId to QuestionList
