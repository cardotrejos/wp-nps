# Story 1.4: Onboarding Progress Persistence

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Business Owner**,
I want to **resume onboarding from where I left off if I abandon the flow**,
so that **I don't have to start over when I return**.

## Acceptance Criteria

1. **Given** I am on step 3 of onboarding **When** I close the browser and return later **Then** I am returned to step 3 automatically **And** my previously entered data is preserved

2. **Given** I completed step 2 but not step 3 **When** I log back in within 24 hours **Then** I see my progress stepper showing step 3 **And** I can continue from where I left off

3. **Given** my QR code expired during abandonment **When** I resume onboarding on the WhatsApp connection step **Then** a new QR code is automatically generated **And** I can scan the fresh QR code to connect

4. **Given** I am a returning user with incomplete onboarding **When** I navigate to the dashboard **Then** I am redirected to my current onboarding step **And** I see a message indicating my progress

5. **Given** I have completed all onboarding steps **When** I navigate to any authenticated route **Then** I am not redirected to onboarding **And** I can access the dashboard normally

## Tasks / Subtasks

- [ ] Task 1: Add Onboarding State to Organization Table (AC: #1, #2)
  - [ ] 1.1 Add `onboardingState` column to `organization` table in `packages/db/src/schema/auth.ts`
  - [ ] 1.2 Define `OnboardingState` type with fields: `currentStep`, `completedSteps`, `lastActivityAt`, `metadata`
  - [ ] 1.3 Create Drizzle migration for new column
  - [ ] 1.4 Add default onboarding state value: `{ currentStep: 1, completedSteps: [], lastActivityAt: null, metadata: {} }`

- [ ] Task 2: Create Onboarding State API Procedures (AC: #1, #2, #4)
  - [ ] 2.1 Create `packages/api/src/routers/onboarding.ts` with `onboardingRouter`
  - [ ] 2.2 Implement `onboarding.getState` protected procedure to fetch current onboarding state
  - [ ] 2.3 Implement `onboarding.updateStep` protected procedure to update current step
  - [ ] 2.4 Implement `onboarding.completeStep` protected procedure to mark step as completed
  - [ ] 2.5 Implement `onboarding.isComplete` protected procedure to check if onboarding is done
  - [ ] 2.6 Add `onboardingRouter` to main router in `packages/api/src/routers/index.ts`
  - [ ] 2.7 Ensure ALL procedures filter by `orgId` from session (multi-tenancy - CRITICAL)

- [ ] Task 3: Create useOnboarding Hook (AC: #1, #2, #4)
  - [ ] 3.1 Create `apps/web/src/hooks/use-onboarding.ts`
  - [ ] 3.2 Implement `useOnboardingState()` to fetch and cache onboarding state
  - [ ] 3.3 Implement `useCompleteStep(step)` mutation to mark steps complete
  - [ ] 3.4 Implement `useUpdateCurrentStep(step)` mutation to update current step
  - [ ] 3.5 Add optimistic updates for step completion
  - [ ] 3.6 Invalidate onboarding queries on completion

- [ ] Task 4: Create Onboarding Guard Component (AC: #4, #5)
  - [ ] 4.1 Create `apps/web/src/components/onboarding/onboarding-guard.tsx`
  - [ ] 4.2 Wrap authenticated routes to check onboarding completion
  - [ ] 4.3 Redirect to appropriate onboarding step if incomplete
  - [ ] 4.4 Allow access to dashboard if onboarding complete
  - [ ] 4.5 Show loading state while checking onboarding status
  - [ ] 4.6 Handle edge case: user navigates directly to wrong onboarding step

- [ ] Task 5: Update Onboarding Routes with State Persistence (AC: #1, #2, #3)
  - [ ] 5.1 Update `apps/web/src/routes/_authenticated/onboarding/index.tsx` as entry/router
  - [ ] 5.2 Create step routing logic that reads from onboarding state
  - [ ] 5.3 On step completion, call `completeStep` and update state
  - [ ] 5.4 Update ProgressStepper to read from persisted state
  - [ ] 5.5 Add "Resume" messaging when returning user detected

- [ ] Task 6: Handle WhatsApp QR Expiry on Resume (AC: #3)
  - [ ] 6.1 Check WhatsApp connection status when resuming step 2
  - [ ] 6.2 If connection is 'pending' with expired QR, auto-refresh QR code
  - [ ] 6.3 Show "Welcome back!" message with status of connection
  - [ ] 6.4 If connection is 'active', skip to step 3 automatically

- [ ] Task 7: Store Onboarding Metadata (AC: #1)
  - [ ] 7.1 Store selected template ID in onboarding metadata when user selects
  - [ ] 7.2 Store WhatsApp connection status in metadata for quick access
  - [ ] 7.3 Store timestamp of each step completion
  - [ ] 7.4 Store any user preferences collected during onboarding

- [ ] Task 8: Create Onboarding Completion Detection (AC: #5)
  - [ ] 8.1 Define onboarding completion criteria: all steps completed
  - [ ] 8.2 Create `isOnboardingComplete` utility function
  - [ ] 8.3 Mark organization as onboarding complete when all steps done
  - [ ] 8.4 Set `onboardingCompletedAt` timestamp in organization record
  - [ ] 8.5 Trigger celebration/success state on completion

- [ ] Task 9: Write Integration Tests (AC: #1, #2, #3, #4, #5)
  - [ ] 9.1 Test onboarding state persists across sessions
  - [ ] 9.2 Test user resumes at correct step after abandonment
  - [ ] 9.3 Test expired QR code triggers auto-refresh on resume
  - [ ] 9.4 Test completed onboarding allows dashboard access
  - [ ] 9.5 Test incomplete onboarding redirects to correct step
  - [ ] 9.6 Test multi-tenant isolation of onboarding state
  - [ ] 9.7 Test step completion updates state correctly

## Dev Notes

### Critical Architecture Compliance

**Organization Table Extension:**
The Better Auth organization plugin creates the `organization` table. We extend it with `onboardingState` JSON column:

```typescript
// packages/db/src/schema/auth.ts - Extend organization table
// Note: Better Auth creates the organization table via plugin
// We add our custom column via migration

// Onboarding state type definition
export const onboardingStateSchema = z.object({
  currentStep: z.number().min(1).max(4).default(1),
  completedSteps: z.array(z.number()).default([]),
  lastActivityAt: z.string().nullable().default(null),
  onboardingCompletedAt: z.string().nullable().default(null),
  metadata: z.object({
    selectedTemplateId: z.string().optional(),
    whatsappConnected: z.boolean().optional(),
    stepCompletedAt: z.record(z.string(), z.string()).optional(),
  }).default({}),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

// Default onboarding state
export const defaultOnboardingState: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
  lastActivityAt: null,
  onboardingCompletedAt: null,
  metadata: {},
};
```

**Onboarding Steps Definition:**
```typescript
// apps/web/src/lib/onboarding.ts
export const ONBOARDING_STEPS = {
  ACCOUNT_CREATED: 1,      // Step 1: Account + Org created (auto-complete on signup)
  WHATSAPP_CONNECTED: 2,   // Step 2: WhatsApp QR scanned and verified
  TEMPLATE_SELECTED: 3,    // Step 3: First survey template chosen
  COMPLETE: 4,             // Step 4: All done, redirect to dashboard
} as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

export const STEP_ROUTES: Record<number, string> = {
  1: '/onboarding',           // Entry point (redirects to step 2 if account done)
  2: '/onboarding/whatsapp',  // WhatsApp connection
  3: '/onboarding/template',  // Template selection
  4: '/dashboard',            // Onboarding complete
};

export function isOnboardingComplete(state: OnboardingState): boolean {
  return state.completedSteps.includes(3) || !!state.onboardingCompletedAt;
}

export function getNextStep(state: OnboardingState): number {
  const completed = state.completedSteps;
  if (!completed.includes(1)) return 1;
  if (!completed.includes(2)) return 2;
  if (!completed.includes(3)) return 3;
  return 4; // Complete
}
```

**Multi-Tenancy Enforcement (AR8, AR11):**
```typescript
// EVERY query MUST include orgId filter - NON-NEGOTIABLE
const org = await db.query.organization.findFirst({
  where: eq(organization.id, context.session.activeOrganizationId),
});
```

### Previous Story Dependencies (1.1 → 1.2 → 1.3 → 1.4)

**From Story 1.1 (Registration):**
- Organization created with user as owner
- Session provides `activeOrganizationId`
- User redirected to `/onboarding` after signup
- Step 1 (account creation) is implicitly complete after signup

**From Story 1.2 (WhatsApp QR Connection):**
- `whatsapp_connection` table tracks connection status
- QR code polling established with 3-second intervals
- Connection status: 'pending' → 'active'
- Route: `/onboarding/whatsapp`

**From Story 1.3 (WhatsApp Verification):**
- Connection verified via test message
- Status transitions: 'active' → 'verified'
- Route: `/onboarding/verify`

**Onboarding Flow Dependencies:**
```
Step 1: Account Created (automatic after signup - Story 1.1)
  ↓
Step 2: WhatsApp Connected (Story 1.2 + 1.3)
  ↓
Step 3: Template Selected (Story 1.5 - future)
  ↓
Complete: Dashboard Access
```

### Project Structure Notes

**Files to Create:**
- `apps/web/src/hooks/use-onboarding.ts` - Onboarding state management hook
- `apps/web/src/components/onboarding/onboarding-guard.tsx` - Route protection component
- `apps/web/src/lib/onboarding.ts` - Onboarding constants and utilities
- `packages/api/src/routers/onboarding.ts` - Onboarding state API router
- `tests/integration/onboarding-persistence.test.ts` - Integration tests

**Files to Modify:**
- `packages/db/src/schema/auth.ts` - Add onboardingState type (if extending)
- `packages/api/src/routers/index.ts` - Add onboardingRouter
- `apps/web/src/routes/_authenticated/onboarding/index.tsx` - Entry point routing
- `apps/web/src/routes/_authenticated/onboarding/whatsapp.tsx` - Add state persistence
- `apps/web/src/routes/_authenticated/_layout.tsx` - Add OnboardingGuard wrapper

**Database Migration:**
```sql
-- Migration: Add onboarding_state to organization
ALTER TABLE organization
ADD COLUMN onboarding_state JSONB DEFAULT '{"currentStep":1,"completedSteps":[],"lastActivityAt":null,"metadata":{}}';

-- Index for querying incomplete onboarding
CREATE INDEX idx_org_onboarding_incomplete
ON organization((onboarding_state->>'onboardingCompletedAt'))
WHERE onboarding_state->>'onboardingCompletedAt' IS NULL;
```

**Dependencies:**
- No new dependencies required
- Uses existing: TanStack Query, TanStack Router, Drizzle

**Naming Conventions:**
- Hook files: kebab-case with use- prefix (`use-onboarding.ts`)
- Component files: kebab-case (`onboarding-guard.tsx`)
- Utility files: kebab-case (`onboarding.ts`)
- Router files: kebab-case (`onboarding.ts`)
- Test files: kebab-case with .test suffix (`onboarding-persistence.test.ts`)

### Component Implementation Patterns

**useOnboarding Hook:**
```typescript
// apps/web/src/hooks/use-onboarding.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/utils/orpc';
import type { OnboardingState } from '@/lib/onboarding';

export function useOnboardingState() {
  return useQuery({
    queryKey: ['onboarding', 'state'],
    queryFn: () => client.onboarding.getState(),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCompleteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (step: number) => client.onboarding.completeStep({ step }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useUpdateCurrentStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (step: number) => client.onboarding.updateStep({ step }),
    onMutate: async (newStep) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['onboarding', 'state'] });
      const previous = queryClient.getQueryData(['onboarding', 'state']);
      queryClient.setQueryData(['onboarding', 'state'], (old: OnboardingState | undefined) => {
        if (!old) return old;
        return { ...old, currentStep: newStep, lastActivityAt: new Date().toISOString() };
      });
      return { previous };
    },
    onError: (err, newStep, context) => {
      queryClient.setQueryData(['onboarding', 'state'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useIsOnboardingComplete() {
  const { data: state, isPending } = useOnboardingState();

  return {
    isComplete: state?.onboardingCompletedAt != null || (state?.completedSteps ?? []).includes(3),
    isPending,
  };
}
```

**OnboardingGuard Component:**
```typescript
// apps/web/src/components/onboarding/onboarding-guard.tsx
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useOnboardingState, useIsOnboardingComplete } from '@/hooks/use-onboarding';
import { getNextStep, STEP_ROUTES } from '@/lib/onboarding';
import Loader from '@/components/loader';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requireComplete?: boolean;
}

export function OnboardingGuard({ children, requireComplete = true }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const { data: state, isPending } = useOnboardingState();
  const { isComplete } = useIsOnboardingComplete();

  useEffect(() => {
    if (isPending) return;

    if (requireComplete && !isComplete && state) {
      // Redirect to appropriate onboarding step
      const nextStep = getNextStep(state);
      const route = STEP_ROUTES[nextStep];
      if (route) {
        navigate({ to: route });
      }
    }
  }, [isPending, isComplete, state, requireComplete, navigate]);

  if (isPending) {
    return <Loader />;
  }

  if (requireComplete && !isComplete) {
    return <Loader />; // Will redirect
  }

  return <>{children}</>;
}
```

**Onboarding Router Implementation:**
```typescript
// packages/api/src/routers/onboarding.ts
import { protectedProcedure } from '../context';
import { z } from 'zod';
import { db } from '@wp-nps/db';
import { organization } from '@wp-nps/db/schema/auth';
import { eq } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';

const onboardingStateSchema = z.object({
  currentStep: z.number(),
  completedSteps: z.array(z.number()),
  lastActivityAt: z.string().nullable(),
  onboardingCompletedAt: z.string().nullable(),
  metadata: z.object({
    selectedTemplateId: z.string().optional(),
    whatsappConnected: z.boolean().optional(),
    stepCompletedAt: z.record(z.string(), z.string()).optional(),
  }),
});

const defaultState = {
  currentStep: 1,
  completedSteps: [],
  lastActivityAt: null,
  onboardingCompletedAt: null,
  metadata: {},
};

export const onboardingRouter = {
  // Get current onboarding state
  getState: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
    });

    if (!org) {
      throw new ORPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
    }

    // Parse onboarding state from JSON column
    const state = (org as any).onboardingState ?? defaultState;
    return onboardingStateSchema.parse(state);
  }),

  // Update current step
  updateStep: protectedProcedure
    .input(z.object({ step: z.number().min(1).max(4) }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.activeOrganizationId;
      if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

      const org = await db.query.organization.findFirst({
        where: eq(organization.id, orgId),
      });

      if (!org) {
        throw new ORPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      const currentState = (org as any).onboardingState ?? defaultState;
      const newState = {
        ...currentState,
        currentStep: input.step,
        lastActivityAt: new Date().toISOString(),
      };

      await db.update(organization)
        .set({ onboardingState: newState } as any)
        .where(eq(organization.id, orgId));

      return newState;
    }),

  // Complete a step
  completeStep: protectedProcedure
    .input(z.object({
      step: z.number().min(1).max(4),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.activeOrganizationId;
      if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

      const org = await db.query.organization.findFirst({
        where: eq(organization.id, orgId),
      });

      if (!org) {
        throw new ORPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      const currentState = (org as any).onboardingState ?? defaultState;
      const completedSteps = [...new Set([...currentState.completedSteps, input.step])];
      const stepCompletedAt = {
        ...(currentState.metadata?.stepCompletedAt ?? {}),
        [input.step.toString()]: new Date().toISOString(),
      };

      // Check if all steps completed (steps 1, 2, 3)
      const isComplete = [1, 2, 3].every(s => completedSteps.includes(s));

      const newState = {
        ...currentState,
        currentStep: isComplete ? 4 : input.step + 1,
        completedSteps,
        lastActivityAt: new Date().toISOString(),
        onboardingCompletedAt: isComplete ? new Date().toISOString() : null,
        metadata: {
          ...currentState.metadata,
          ...(input.metadata ?? {}),
          stepCompletedAt,
        },
      };

      await db.update(organization)
        .set({ onboardingState: newState } as any)
        .where(eq(organization.id, orgId));

      return newState;
    }),

  // Check if onboarding is complete
  isComplete: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
    });

    if (!org) {
      throw new ORPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
    }

    const state = (org as any).onboardingState ?? defaultState;
    const isComplete = state.onboardingCompletedAt != null || state.completedSteps?.includes(3);

    return { isComplete };
  }),
};
```

**Updated Onboarding Entry Route:**
```typescript
// apps/web/src/routes/_authenticated/onboarding/index.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { getNextStep, STEP_ROUTES, isOnboardingComplete } from '@/lib/onboarding';
import Loader from '@/components/loader';

export const Route = createFileRoute('/_authenticated/onboarding/')({
  component: OnboardingEntry,
});

function OnboardingEntry() {
  const navigate = useNavigate();
  const { data: state, isPending } = useOnboardingState();

  useEffect(() => {
    if (isPending || !state) return;

    // If onboarding complete, go to dashboard
    if (isOnboardingComplete(state)) {
      navigate({ to: '/dashboard' });
      return;
    }

    // Route to appropriate step
    const nextStep = getNextStep(state);
    const route = STEP_ROUTES[nextStep];

    if (route && route !== '/onboarding') {
      navigate({ to: route });
    }
  }, [state, isPending, navigate]);

  if (isPending) {
    return <Loader />;
  }

  // Show welcome back message for returning users
  if (state && state.lastActivityAt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader />
        <p className="mt-4 text-muted-foreground">
          Welcome back! Resuming your setup...
        </p>
      </div>
    );
  }

  return <Loader />;
}
```

### Testing Standards

**Integration Test Pattern:**
```typescript
// tests/integration/onboarding-persistence.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@wp-nps/db';
import { organization } from '@wp-nps/db/schema/auth';
import { eq } from 'drizzle-orm';
import { createTestOrg, createTestUser } from '../utils/test-helpers';

describe('Onboarding Progress Persistence', () => {
  beforeEach(async () => {
    // Transaction rollback for test isolation
  });

  it('persists onboarding state across sessions', async () => {
    const { org, user } = await createTestOrg('Test Corp');

    // Complete step 1
    await db.update(organization)
      .set({
        onboardingState: {
          currentStep: 2,
          completedSteps: [1],
          lastActivityAt: new Date().toISOString(),
          onboardingCompletedAt: null,
          metadata: {},
        },
      } as any)
      .where(eq(organization.id, org.id));

    // Simulate session reload
    const updatedOrg = await db.query.organization.findFirst({
      where: eq(organization.id, org.id),
    });

    const state = (updatedOrg as any).onboardingState;
    expect(state.currentStep).toBe(2);
    expect(state.completedSteps).toContain(1);
  });

  it('resumes user at correct step after abandonment', async () => {
    const { org } = await createTestOrg('Test Corp');

    // User completed steps 1 and 2, left at step 3
    await db.update(organization)
      .set({
        onboardingState: {
          currentStep: 3,
          completedSteps: [1, 2],
          lastActivityAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          onboardingCompletedAt: null,
          metadata: { whatsappConnected: true },
        },
      } as any)
      .where(eq(organization.id, org.id));

    const updatedOrg = await db.query.organization.findFirst({
      where: eq(organization.id, org.id),
    });

    const state = (updatedOrg as any).onboardingState;
    expect(state.currentStep).toBe(3);
    expect(state.completedSteps).toEqual([1, 2]);
    expect(state.metadata.whatsappConnected).toBe(true);
  });

  it('marks onboarding complete when all steps done', async () => {
    const { org } = await createTestOrg('Test Corp');

    // Complete all steps
    await db.update(organization)
      .set({
        onboardingState: {
          currentStep: 4,
          completedSteps: [1, 2, 3],
          lastActivityAt: new Date().toISOString(),
          onboardingCompletedAt: new Date().toISOString(),
          metadata: { selectedTemplateId: 'nps-1' },
        },
      } as any)
      .where(eq(organization.id, org.id));

    const updatedOrg = await db.query.organization.findFirst({
      where: eq(organization.id, org.id),
    });

    const state = (updatedOrg as any).onboardingState;
    expect(state.onboardingCompletedAt).not.toBeNull();
    expect(state.completedSteps).toEqual([1, 2, 3]);
  });

  it('enforces multi-tenant isolation for onboarding state', async () => {
    const { org: org1 } = await createTestOrg('Org 1');
    const { org: org2 } = await createTestOrg('Org 2');

    // Set different states for each org
    await db.update(organization)
      .set({
        onboardingState: {
          currentStep: 3,
          completedSteps: [1, 2],
          lastActivityAt: new Date().toISOString(),
          onboardingCompletedAt: null,
          metadata: {},
        },
      } as any)
      .where(eq(organization.id, org1.id));

    await db.update(organization)
      .set({
        onboardingState: {
          currentStep: 1,
          completedSteps: [],
          lastActivityAt: null,
          onboardingCompletedAt: null,
          metadata: {},
        },
      } as any)
      .where(eq(organization.id, org2.id));

    // Query each org separately
    const result1 = await db.query.organization.findFirst({
      where: eq(organization.id, org1.id),
    });
    const result2 = await db.query.organization.findFirst({
      where: eq(organization.id, org2.id),
    });

    expect((result1 as any).onboardingState.currentStep).toBe(3);
    expect((result2 as any).onboardingState.currentStep).toBe(1);
  });

  it('updates lastActivityAt on each step interaction', async () => {
    const { org } = await createTestOrg('Test Corp');
    const beforeTime = new Date();

    await db.update(organization)
      .set({
        onboardingState: {
          currentStep: 2,
          completedSteps: [1],
          lastActivityAt: new Date().toISOString(),
          onboardingCompletedAt: null,
          metadata: {},
        },
      } as any)
      .where(eq(organization.id, org.id));

    const updatedOrg = await db.query.organization.findFirst({
      where: eq(organization.id, org.id),
    });

    const state = (updatedOrg as any).onboardingState;
    const activityTime = new Date(state.lastActivityAt);
    expect(activityTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
  });
});
```

### UX Guidelines (from UX Specification)

**Resume Experience:**
- Show "Welcome back!" message when returning user detected
- Display progress stepper with completed steps highlighted
- Auto-navigate to current step after brief loading state
- 1s minimum loading display for perceived smoothness (UX12)

**Progress Stepper (UX7):**
- Steps: 1) Account ✓ → 2) WhatsApp → 3) Template → 4) Complete
- Completed steps show green checkmark
- Current step is highlighted/active
- Future steps are dimmed

**Loading States:**
- Use `<Loader />` during state fetch
- Show meaningful message during redirects
- Skeleton UI for step content while loading

**Error Handling:**
- Graceful fallback if state fetch fails
- Allow manual step navigation as backup
- Toast notifications for state save errors

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-1] Better Auth Organization Extension
- [Source: _bmad-output/planning-artifacts/architecture.md#AR8] Multi-tenancy enforcement
- [Source: _bmad-output/planning-artifacts/architecture.md#AR11] Application-level org filtering
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4] Onboarding Progress Persistence acceptance criteria
- [Source: _bmad-output/project-context.md#TanStack-Query] Query patterns and caching
- [Source: _bmad-output/project-context.md#Multi-Tenancy] orgId filtering requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX7] Progress Stepper patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX12] Loading state timing

### Previous Story Intelligence

**From Story 1.0 (Foundation):**
- Better Auth organization plugin creates `organization` table
- RLS policies enabled on tenant-scoped tables
- Test infrastructure (Vitest) configured

**From Story 1.1 (Registration):**
- Organization created on signup with user as owner
- Session provides `activeOrganizationId`
- User redirected to `/onboarding` after signup
- `generateSlug()` utility available for org slugs

**From Story 1.2 (WhatsApp QR Connection):**
- Route structure: `/onboarding/whatsapp`
- `whatsapp_connection` table tracks status
- QR polling with TanStack Query established
- Connection states: pending → active

**From Story 1.3 (WhatsApp Verification):**
- Verification route: `/onboarding/verify`
- Connection status: active → verified
- Polling patterns for status updates

### Latest Technical Specifics

**TanStack Query (v5.90.12):**
- `staleTime` for caching onboarding state (1 minute recommended)
- Optimistic updates for step completion
- `invalidateQueries` to refresh on mutation success

**Drizzle ORM (v0.45.1):**
- JSONB column support for onboarding state
- Type-safe query building with `eq()`
- Migration via `drizzle-kit generate`

**Better Auth Organization (v1.4.9):**
- Organization table created via plugin
- Custom columns added via Drizzle migration
- Session provides `activeOrganizationId` context

**TanStack Router (v1.141.1):**
- File-based routing in `routes/_authenticated/onboarding/`
- `useNavigate` for programmatic navigation
- Route guards via wrapper components

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log
| Change | File(s) | Reason |
|--------|---------|--------|

### File List

