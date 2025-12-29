# Story 2.4: Preview Survey in WhatsApp Format

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Business Owner**,
I want to **preview how my survey will appear in WhatsApp**,
so that **I can see exactly what my customers will see**.

## Acceptance Criteria

1. **Given** I am on the survey edit page **When** I click "Preview" **Then** I see a mobile phone frame mockup **And** the survey is displayed as it would appear in WhatsApp **And** the preview shows the WhatsApp chat bubble aesthetic (UX3)

2. **Given** I edit a question **When** I view the preview **Then** the preview updates to reflect my changes

3. **Given** I view the preview on desktop **When** I resize my browser **Then** the phone mockup remains properly sized

4. **Given** the survey has multiple questions **When** I view the preview **Then** all questions are displayed in the correct order

5. **Given** the survey is an NPS type **When** I view the preview **Then** I see the 0-10 rating scale displayed as WhatsApp buttons

## Tasks / Subtasks

- [x] Task 1: Create SurveyPreview Component (AC: #1, #3, #4)
  - [x] 1.1 Create `apps/web/src/components/surveys/survey-preview.tsx`
  - [x] 1.2 Implement phone frame mockup container (fixed aspect ratio ~9:16)
  - [x] 1.3 Add WhatsApp-style header (green bar with back arrow)
  - [x] 1.4 Set WhatsApp beige background color (#ece5dd - UX3)
  - [x] 1.5 Make phone frame responsive (max-width, centered)

- [x] Task 2: Create WhatsAppMessage Component (AC: #1, #5)
  - [x] 2.1 Create `apps/web/src/components/surveys/whatsapp-message.tsx`
  - [x] 2.2 Implement chat bubble styling (white bg, rounded corners, tail)
  - [x] 2.3 Display question text in bubble
  - [x] 2.4 Add timestamp styling (small, gray, right-aligned)
  - [x] 2.5 Add checkmark icons for delivered status

- [x] Task 3: Create NPSRatingButtons Component (AC: #5)
  - [x] 3.1 Create `apps/web/src/components/surveys/nps-rating-buttons.tsx`
  - [x] 3.2 Display 0-10 as horizontal buttons (WhatsApp button style)
  - [x] 3.3 Add scale labels (min/max labels from question)
  - [x] 3.4 Style buttons as interactive-looking but non-functional in preview
  - [x] 3.5 Color code: 0-6 red area, 7-8 yellow area, 9-10 green area

- [x] Task 4: Integrate Preview into Survey Edit Page (AC: #1, #2)
  - [x] 4.1 Add "Preview" button to survey edit page header
  - [x] 4.2 Create side-by-side layout (edit on left, preview on right) on desktop
  - [x] 4.3 Create toggle/modal approach on mobile (show/hide preview)
  - [x] 4.4 Pass current survey data to SurveyPreview component
  - [x] 4.5 Ensure preview updates reactively when questions change

- [x] Task 5: Handle Different Question Types in Preview (AC: #4)
  - [x] 5.1 Render rating questions with NPSRatingButtons
  - [x] 5.2 Render text questions with text input placeholder style
  - [x] 5.3 Handle multiple questions with proper spacing
  - [x] 5.4 Show "Required" badge for required questions

- [x] Task 6: Add Preview Responsive Behavior (AC: #3)
  - [x] 6.1 Phone frame scales down on smaller screens
  - [x] 6.2 Maintain aspect ratio at all breakpoints
  - [x] 6.3 Hide preview panel on mobile by default (toggle button)
  - [x] 6.4 Test at 640px, 768px, 1024px breakpoints

- [x] Task 7: Write Component Tests (AC: #1, #4, #5)
  - [x] 7.1 Test SurveyPreview renders phone frame correctly
  - [x] 7.2 Test WhatsAppMessage displays question text
  - [x] 7.3 Test NPSRatingButtons shows 0-10 scale
  - [x] 7.4 Test preview updates when survey data changes
  - [x] 7.5 Test responsive behavior at different widths

## Dev Notes

### Critical Architecture Compliance

**Component File Structure (kebab-case naming):**

```
apps/web/src/components/surveys/
├── survey-preview.tsx        # NEW - Phone frame container
├── whatsapp-message.tsx      # NEW - Chat bubble component
├── nps-rating-buttons.tsx    # NEW - 0-10 rating display
├── survey-card.tsx           # Existing
├── survey-list.tsx           # Existing
├── survey-header.tsx         # Existing
├── question-card.tsx         # Existing
└── question-list.tsx         # Existing
```

**SurveyPreview Component:**

```typescript
// apps/web/src/components/surveys/survey-preview.tsx
import { cn } from '@/lib/utils';
import { WhatsAppMessage } from './whatsapp-message';
import { NPSRatingButtons } from './nps-rating-buttons';
import type { Survey } from '@wp-nps/db/schema';

interface SurveyPreviewProps {
  survey: Survey;
  className?: string;
}

export function SurveyPreview({ survey, className }: SurveyPreviewProps) {
  const questions = survey.questions;

  return (
    <div className={cn('flex justify-center', className)}>
      {/* Phone Frame */}
      <div className="relative w-full max-w-[320px] aspect-[9/16] bg-white rounded-[2rem] shadow-xl border-[8px] border-gray-800 overflow-hidden">
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] h-14 flex items-center px-4 gap-3">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300" />
            <span className="text-white font-medium text-sm">FlowPulse Survey</span>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          className="h-[calc(100%-3.5rem)] overflow-y-auto p-3 space-y-3"
          style={{ backgroundColor: '#ece5dd' }} // WhatsApp beige (UX3)
        >
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <WhatsAppMessage text={question.text} />
              
              {question.type === 'rating' && question.scale && (
                <NPSRatingButtons 
                  min={question.scale.min}
                  max={question.scale.max}
                  labels={question.scale.labels}
                />
              )}
              
              {question.type === 'text' && (
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <span className="text-gray-400 text-sm">Type your response...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**WhatsAppMessage Component:**

```typescript
// apps/web/src/components/surveys/whatsapp-message.tsx
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WhatsAppMessageProps {
  text: string;
  className?: string;
}

export function WhatsAppMessage({ text, className }: WhatsAppMessageProps) {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={cn('flex justify-start', className)}>
      <div className="relative max-w-[85%] bg-white rounded-lg rounded-tl-none shadow-sm p-3 pb-5">
        {/* Message tail */}
        <div className="absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
        
        {/* Message content */}
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{text}</p>
        
        {/* Timestamp and checkmarks */}
        <div className="absolute bottom-1 right-2 flex items-center gap-1">
          <span className="text-[10px] text-gray-500">{timestamp}</span>
          <div className="flex -space-x-1">
            <Check className="w-3 h-3 text-blue-500" />
            <Check className="w-3 h-3 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**NPSRatingButtons Component:**

```typescript
// apps/web/src/components/surveys/nps-rating-buttons.tsx
import { cn } from '@/lib/utils';

interface NPSRatingButtonsProps {
  min: number;
  max: number;
  labels?: { min: string; max: string };
  className?: string;
}

export function NPSRatingButtons({ min, max, labels, className }: NPSRatingButtonsProps) {
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const getButtonColor = (rating: number) => {
    if (rating <= 6) return 'bg-red-100 border-red-300 text-red-700';
    if (rating <= 8) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    return 'bg-green-100 border-green-300 text-green-700';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Rating buttons grid */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            disabled
            className={cn(
              'w-8 h-8 rounded-md border text-sm font-medium',
              'cursor-default opacity-80',
              getButtonColor(rating)
            )}
          >
            {rating}
          </button>
        ))}
      </div>
      
      {/* Labels */}
      {labels && (
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      )}
    </div>
  );
}
```

**Survey Edit Page Update (Side-by-Side Layout):**

```typescript
// apps/web/src/routes/surveys.$surveyId.tsx - MODIFY
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SurveyPreview } from '@/components/surveys/survey-preview';
import { Eye, EyeOff } from 'lucide-react';

// Inside the component:
const [showPreview, setShowPreview] = useState(true);

// In the return JSX:
return (
  <div className="container mx-auto py-6">
    <SurveyHeader survey={survey} />
    
    {/* Mobile: Preview Toggle Button */}
    <div className="lg:hidden mb-4">
      <Button
        variant="outline"
        onClick={() => setShowPreview(!showPreview)}
        className="w-full"
      >
        {showPreview ? (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Hide Preview
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Show Preview
          </>
        )}
      </Button>
    </div>
    
    {/* Desktop: Side-by-side layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Edit Panel */}
      <div>
        <QuestionList
          surveyId={surveyId}
          questions={survey.questions}
        />
      </div>
      
      {/* Preview Panel */}
      <div className={cn(
        'lg:sticky lg:top-6 lg:self-start',
        !showPreview && 'hidden lg:block'
      )}>
        <div className="lg:border lg:rounded-lg lg:p-4 lg:bg-muted/50">
          <h3 className="text-sm font-medium mb-4 hidden lg:block">
            WhatsApp Preview
          </h3>
          <SurveyPreview survey={survey} />
        </div>
      </div>
    </div>
  </div>
);
```

### Previous Story Dependencies (Story 2.3 -> Story 2.4)

**From Story 2.3 (Edit Survey Question Text):**

- Inline editing with debounced auto-save is functional
- `survey.updateQuestion` procedure updates questions in JSONB
- `useUpdateQuestion` mutation hook with optimistic updates
- QuestionCard has save status indicators (Saved/Saving.../Error)
- Survey data refreshes reactively after edits

**From Story 2.2 (Create Survey from Template):**

- Survey edit page at `/surveys/$surveyId`
- `SurveyHeader` displays name, type, status
- `QuestionList` displays questions in order
- `useSurvey(surveyId)` hook for fetching survey data

**Infrastructure to EXTEND (not recreate):**

- Modify `apps/web/src/routes/surveys.$surveyId.tsx` to add preview panel
- Create new components in `apps/web/src/components/surveys/`

**Survey Questions Schema (from Story 2.1):**

```typescript
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

- `apps/web/src/components/surveys/survey-preview.tsx` - Phone frame container
- `apps/web/src/components/surveys/whatsapp-message.tsx` - Chat bubble component
- `apps/web/src/components/surveys/nps-rating-buttons.tsx` - Rating buttons display

**Files to Modify:**

- `apps/web/src/routes/surveys.$surveyId.tsx` - Add preview panel with side-by-side layout

**Tests to Create:**

- `apps/web/src/components/surveys/__tests__/survey-preview.test.tsx`
- `apps/web/src/components/surveys/__tests__/whatsapp-message.test.tsx`
- `apps/web/src/components/surveys/__tests__/nps-rating-buttons.test.tsx`

### UX Requirements (from UX Design Spec)

**WhatsApp Aesthetic (UX3):**

- Background color: `#ece5dd` (WhatsApp beige)
- Chat bubbles: White with rounded corners, small shadow
- Message tail: Triangle pointing to sender
- Timestamp: Small gray text with blue double-checkmarks

**Phone Frame Mockup:**

- Aspect ratio: ~9:16 (standard mobile)
- Max width: 320px (iPhone SE width)
- Border radius: 2rem (modern phone style)
- WhatsApp header: Dark green (#075e54)

**Responsive Breakpoints:**

- Mobile (< 640px): Preview hidden by default, toggle button
- Tablet (640px - 1024px): Preview can be toggled
- Desktop (> 1024px): Side-by-side layout with sticky preview

**Color Coding for NPS Buttons:**

- Detractors (0-6): Red tones
- Passives (7-8): Yellow tones
- Promoters (9-10): Green tones

### Testing Standards

**Component Tests (Vitest + React Testing Library):**

```typescript
// apps/web/src/components/surveys/__tests__/survey-preview.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SurveyPreview } from '../survey-preview';

describe('SurveyPreview', () => {
  const mockSurvey = {
    id: 'survey-1',
    orgId: 'org-1',
    name: 'Test Survey',
    type: 'nps' as const,
    status: 'draft' as const,
    questions: [
      {
        id: 'q1',
        text: 'How likely are you to recommend us?',
        type: 'rating' as const,
        required: true,
        scale: { min: 0, max: 10, labels: { min: 'Not likely', max: 'Very likely' } },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders phone frame with WhatsApp header', () => {
    render(<SurveyPreview survey={mockSurvey} />);
    expect(screen.getByText('FlowPulse Survey')).toBeInTheDocument();
  });

  it('displays question text in chat bubble', () => {
    render(<SurveyPreview survey={mockSurvey} />);
    expect(screen.getByText('How likely are you to recommend us?')).toBeInTheDocument();
  });

  it('renders NPS rating buttons for rating questions', () => {
    render(<SurveyPreview survey={mockSurvey} />);
    // Check 0-10 buttons are present
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders scale labels when provided', () => {
    render(<SurveyPreview survey={mockSurvey} />);
    expect(screen.getByText('Not likely')).toBeInTheDocument();
    expect(screen.getByText('Very likely')).toBeInTheDocument();
  });
});
```

### Anti-Patterns to Avoid

```typescript
// WRONG: Using px values instead of Tailwind classes
<div style={{ width: '320px', height: '568px' }}>

// CORRECT: Use Tailwind with max-width and aspect ratio
<div className="w-full max-w-[320px] aspect-[9/16]">

// WRONG: Hardcoding colors without semantic meaning
<div style={{ backgroundColor: '#ece5dd' }}>

// CORRECT: Use inline style for brand-specific colors (WhatsApp) that aren't in design system
<div style={{ backgroundColor: '#ece5dd' }}> // WhatsApp beige - UX3 requirement

// WRONG: Not handling empty questions array
{questions.map((q) => ...)} // Crashes if questions is undefined

// CORRECT: Guard against undefined
{(questions ?? []).map((q) => ...)}

// WRONG: Making preview buttons interactive
<button onClick={() => setRating(i)}>

// CORRECT: Preview is display-only, buttons are disabled
<button type="button" disabled className="cursor-default">

// WRONG: Not using responsive design
<div className="grid-cols-2"> // Always 2 columns

// CORRECT: Responsive grid
<div className="grid grid-cols-1 lg:grid-cols-2">

// WRONG: Not using cn() for conditional classes
className={`${showPreview ? '' : 'hidden'} lg:block`}

// CORRECT: Use cn() utility
className={cn(!showPreview && 'hidden', 'lg:block')}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4] Preview Survey in WhatsApp Format requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#UX-Requirements] UX3 WhatsApp beige background
- [Source: _bmad-output/planning-artifacts/architecture.md#Responsive-Breakpoints] 640px, 768px, 1024px
- [Source: _bmad-output/implementation-artifacts/2-3-edit-survey-question-text.md] Previous story context
- [Source: _bmad-output/project-context.md#shadcn-ui] cn() utility usage
- [Source: _bmad-output/project-context.md#File-Naming] kebab-case component files

### Previous Story Intelligence

**From Story 2.3 (Edit Survey Question Text) - Learnings:**

1. Survey data updates reactively via TanStack Query invalidation
2. Questions are stored as JSONB array with specific structure
3. Each question has: id, text, type, scale (optional), required
4. Route file is `surveys.$surveyId.tsx` (flat file naming)
5. QuestionList already receives surveyId as prop

**Key Integration Points:**

- SurveyPreview receives `survey` prop (same data as QuestionList)
- Preview updates automatically when survey data changes (TanStack Query)
- No additional API calls needed - preview uses existing survey data

**Code Review Fixes from Story 2.3 (apply same patterns):**

- Use stable callbacks with useCallback
- Handle potential undefined arrays with ?? []
- Use cn() for all conditional class logic

### Connection to Story Sequence

**Story Flow in Epic 2:**

- 2.1 Survey Template Gallery - View and select templates
- 2.2 Create Survey from Template - Create survey, redirect to edit page
- 2.3 Edit Survey Question Text - Modify question text inline
- **2.4 Preview Survey in WhatsApp Format (THIS STORY)** - See WhatsApp preview
- 2.5 Test Survey on Myself - Send test via WhatsApp
- 2.6 Activate or Deactivate Survey - Control survey state
- 2.7 Set Survey Trigger Type - Configure API or manual trigger

**What Story 2.4 Enables:**

- Users can see exactly how their survey will appear in WhatsApp
- Visual validation before sending test (Story 2.5)
- Confidence in customizations made in Story 2.3

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (Anthropic)

### Debug Log References

- No blocking issues encountered during implementation

### Completion Notes List

- Created three new React components following kebab-case naming convention
- SurveyPreview: Phone frame mockup with WhatsApp header (9:16 aspect ratio, #ece5dd background)
- WhatsAppMessage: Chat bubble with timestamp and blue double-checkmarks
- NPSRatingButtons: Color-coded 0-10 rating scale (red/yellow/green)
- Integrated preview into survey edit page with side-by-side layout (desktop) and toggle (mobile)
- Preview updates reactively via TanStack Query when questions are edited
- Added comprehensive test suite (34 tests passing) covering all components
- Set up vitest config for web app with jsdom environment
- All TypeScript type checks pass

### Change Log

- 2025-12-29: Story 2.4 implementation complete - WhatsApp preview feature fully functional
- 2025-12-29: Code review fixes applied - Added accessibility attributes, fixed timestamp determinism, improved color logic for multiple scale types, added reactivity and responsive tests

### File List

**New Files:**
- apps/web/src/components/surveys/survey-preview.tsx (imports type from @wp-nps/db)
- apps/web/src/components/surveys/whatsapp-message.tsx
- apps/web/src/components/surveys/nps-rating-buttons.tsx
- apps/web/src/components/surveys/__tests__/survey-preview.test.tsx
- apps/web/src/components/surveys/__tests__/whatsapp-message.test.tsx
- apps/web/src/components/surveys/__tests__/nps-rating-buttons.test.tsx
- apps/web/src/test-setup.ts
- apps/web/vitest.config.ts

**Modified Files:**
- apps/web/src/routes/surveys.$surveyId.tsx (added preview panel integration)
- apps/web/package.json (added test dependencies and scripts)
- vitest.config.ts (excluded web app from root tests, handled separately)

**Cross-Package Dependencies:**
- survey-preview.tsx imports `type { Survey, SurveyQuestion }` from `@wp-nps/db/schema/flowpulse` (type-only, tree-shaken)

