# Story 1.3: WhatsApp Connection Verification

Status: done

## Story

As a **Business Owner**,
I want to **verify my WhatsApp connection with a test message**,
so that **I know the integration is working before sending to customers**.

## Acceptance Criteria

1. **Given** I have connected my WhatsApp number **When** I click "Send Test Message" **Then** a test message is sent to my own WhatsApp number **And** I see "Test sent - check your WhatsApp" confirmation

2. **Given** I receive the test message on my WhatsApp **When** I confirm receipt in the app **Then** the connection is marked as "verified" **And** I can proceed to the next onboarding step

3. **Given** the test message fails to send **When** Kapso returns an error **Then** I see an error message with retry option **And** troubleshooting guidance is displayed

4. **Given** the test message is successfully delivered **When** polling detects the delivery status as "delivered" **Then** the UI updates automatically to show delivery confirmation **And** the "Confirm Receipt" button becomes prominent

5. **Given** I am on mobile viewport **When** viewing the verification screen **Then** all UI elements are properly sized for touch interaction **And** the layout is responsive and usable

## Tasks / Subtasks

- [x] Task 1: Extend IKapsoClient for Test Message (AC: #1, #3)
  - [x] 1.1 Add `sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult>` to `IKapsoClient` interface in `packages/kapso/src/types.ts`
  - [x] 1.2 Define `SendTestParams` type: `{ phoneNumber: string; orgId: string; }`
  - [x] 1.3 Add test message error codes to `KapsoErrorCode`: `test_message_failed`, `phone_not_connected`

- [x] Task 2: Implement KapsoMockClient Test Message Methods (AC: #1, #3, #4)
  - [x] 2.1 Implement `sendTestMessage()` mock in `packages/kapso/src/mock.ts`
  - [x] 2.2 Add `mockTestMessageSuccess(deliveryId)` helper method
  - [x] 2.3 Add `mockTestMessageFailure(deliveryId, errorCode)` helper method
  - [x] 2.4 Add `mockDeliveryConfirmed(deliveryId)` helper for status polling
  - [x] 2.5 Write unit tests for all new mock methods

- [x] Task 3: Create WhatsApp Verification API Procedures (AC: #1, #2, #3, #4)
  - [x] 3.1 whatsappRouter already existed from story 1.2, extended with verification methods
  - [x] 3.2 Implement `whatsapp.sendTestMessage` protected procedure
  - [x] 3.3 Implement `whatsapp.confirmVerification` protected procedure (manual confirmation)
  - [x] 3.4 Implement `whatsapp.getVerificationStatus` protected procedure (polling)
  - [x] 3.5 whatsappRouter was already added to main router in story 1.2
  - [x] 3.6 Ensure ALL procedures filter by `orgId` from session (multi-tenancy - CRITICAL)

- [x] Task 4: Implement Verification Business Logic (AC: #1, #2)
  - [x] 4.1 Create verification logic that calls Kapso `sendTestMessage` API
  - [x] 4.2 Store test message `deliveryId` in `whatsapp_connection.metadata`
  - [x] 4.3 On manual confirmation, update `whatsapp_connection.status = 'verified'`
  - [x] 4.4 Track verification attempts in metadata for troubleshooting
  - [x] 4.5 Retry logic with max 3 attempts handled in UI

- [x] Task 5: Create VerificationStep Component (AC: #1, #2, #4, #5)
  - [x] 5.1 Create `apps/web/src/components/onboarding/verification-step.tsx`
  - [x] 5.2 Display connected phone number (masked: +55 ** \*** \*\*99)
  - [x] 5.3 Add "Send Test Message" button with loading state
  - [x] 5.4 Show success message: "Test sent - check your WhatsApp"
  - [x] 5.5 Add "I Received It" confirmation button (prominent after send)
  - [x] 5.6 Implement mobile-responsive layout

- [x] Task 6: Implement Delivery Status Polling (AC: #4)
  - [x] 6.1 Create `useVerificationStatus` hook in `apps/web/src/hooks/use-verification-status.ts`
  - [x] 6.2 Poll `whatsapp.getVerificationStatus` every 3 seconds after test sent
  - [x] 6.3 Stop polling when status is 'delivered' or after 2 minutes
  - [x] 6.4 Update UI with delivery status badge (Sent → Delivered)
  - [x] 6.5 Show "Delivered!" badge when message is confirmed delivered

- [x] Task 7: Create Troubleshooting UI (AC: #3)
  - [x] 7.1 Create `apps/web/src/components/onboarding/verification-troubleshooting.tsx`
  - [x] 7.2 Display error message from Kapso (user-friendly)
  - [x] 7.3 Show troubleshooting tips: "Check WhatsApp is open", "Verify phone number"
  - [x] 7.4 Add "Try Again" button to resend test message
  - [x] 7.5 Add "Reconnect WhatsApp" link to go back to onboarding step
  - [x] 7.6 Show attempt counter: "Attempt 2 of 3"

- [x] Task 8: Create Onboarding Verification Route (AC: #1, #2, #3, #5)
  - [x] 8.1 Updated existing `apps/web/src/routes/onboarding.tsx` with verify step
  - [x] 8.2 Integrate VerificationStep component
  - [x] 8.3 Integrate ProgressStepper showing step 3 of onboarding
  - [x] 8.4 Handle success state with navigation to next step
  - [x] 8.5 Guard route: auto-detect connection status and advance to correct step
  - [x] 8.6 Handle loading states with `<Loader />`

- [x] Task 9: Write Integration Tests (AC: #1, #2, #3, #4)
  - [x] 9.1 Test `sendTestMessage` creates pending verification state
  - [x] 9.2 Test `confirmVerification` updates status to verified
  - [x] 9.3 Test polling detects delivery status changes
  - [x] 9.4 Test error handling with failure codes
  - [x] 9.5 Test multi-tenant isolation (org A cannot verify org B's connection)
  - [x] 9.6 Test retry logic with attempt tracking

## Dev Notes

### Critical Architecture Compliance

**Kapso Integration Package (AR2):**
This story extends the Kapso package at `packages/kapso/` with test message operations. The `IKapsoClient` interface already exists with `sendSurvey` and `getDeliveryStatus` methods. We're adding `sendTestMessage` as a simplified version for verification.

```typescript
// packages/kapso/src/types.ts - EXTEND with test message types
export interface SendTestParams {
  phoneNumber: string;
  orgId: string;
}

// Add to IKapsoClient interface
export interface IKapsoClient {
  // ... existing methods from 1.2
  sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult>;
  getDeliveryStatus(deliveryId: string): Promise<SurveyDeliveryResult>;
  verifyWebhook(signature: string, payload: string): boolean;

  // NEW: Test message for verification
  sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult>;
}

// Add to error codes
export const kapsoErrorCodeSchema = z.enum([
  "rate_limited",
  "invalid_phone",
  "connection_lost",
  "message_failed",
  "unknown_error",
  "test_message_failed",  // NEW
  "phone_not_connected",  // NEW
]);
```

**WhatsApp Connection Table Schema (Already Created in 1.0):**

```typescript
// packages/db/src/schema/flowpulse.ts - whatsappConnection table
// Fields: id, orgId, phoneNumber, status, kapsoId, connectedAt, lastSeenAt, metadata
// Status values: 'pending', 'active', 'verified', 'disconnected', 'failed'
// Note: Story 1.2 sets status to 'active', this story updates to 'verified'
```

**Status Flow:**

```
pending → active (1.2: QR scanned) → verified (1.3: test confirmed) → disconnected (future)
```

**Multi-Tenancy Enforcement (AR8, AR11):**

```typescript
// EVERY query MUST include orgId filter - NON-NEGOTIABLE
const connection = await db.query.whatsappConnection.findFirst({
  where: eq(whatsappConnection.orgId, context.session.activeOrganizationId),
});
```

### Previous Story Dependencies (1.2 → 1.3)

**From Story 1.2 (WhatsApp Connection via QR Code):**

- `whatsapp_connection` record exists with `status = 'active'`
- `phoneNumber` is stored in the record
- `kapsoId` (session ID) is stored from QR connection
- QR code types and mock methods already implemented

**Prerequisite Check:**

```typescript
// Guard: Must have active connection before verification
const connection = await db.query.whatsappConnection.findFirst({
  where: and(
    eq(whatsappConnection.orgId, orgId),
    eq(whatsappConnection.status, 'active'),
  ),
});

if (!connection?.phoneNumber) {
  throw new ORPCError({
    code: 'PRECONDITION_FAILED',
    message: 'WhatsApp not connected. Please scan QR code first.',
  });
}
```

### Project Structure Notes

**Files to Create:**

- `packages/api/src/routers/whatsapp.ts` - WhatsApp verification router
- `apps/web/src/components/onboarding/verification-step.tsx` - Main verification component
- `apps/web/src/components/onboarding/verification-troubleshooting.tsx` - Error/retry UI
- `apps/web/src/hooks/use-verification-status.ts` - Polling hook
- `apps/web/src/routes/_authenticated/onboarding/verify.tsx` - Verification route
- `packages/api/src/routers/whatsapp.test.ts` - Router tests
- `tests/integration/whatsapp-verification.test.ts` - Integration tests

**Files to Modify:**

- `packages/kapso/src/types.ts` - Add `sendTestMessage` to interface, new error codes
- `packages/kapso/src/mock.ts` - Add test message mock methods
- `packages/kapso/src/index.ts` - Export new types
- `packages/api/src/routers/index.ts` - Add whatsappRouter

**Dependencies:**

- No new dependencies required
- Uses existing: TanStack Query, TanStack Router, shadcn/ui, oRPC

**Naming Conventions (from architecture.md):**

- Component files: kebab-case (`verification-step.tsx`)
- Component exports: PascalCase (`VerificationStep`)
- Hook files: kebab-case with use- prefix (`use-verification-status.ts`)
- Router files: kebab-case (`whatsapp.ts`)
- Test files: kebab-case with .test suffix (`whatsapp.test.ts`)

### Component Implementation Patterns

**VerificationStep Component Structure:**

```typescript
// apps/web/src/components/onboarding/verification-step.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { useVerificationStatus } from '@/hooks/use-verification-status';
import { toast } from 'sonner';
import Loader from '@/components/loader';
import { VerificationTroubleshooting } from './verification-troubleshooting';

interface VerificationStepProps {
  phoneNumber: string;  // Masked phone from parent
  onVerified: () => void;
}

export function VerificationStep({ phoneNumber, onVerified }: VerificationStepProps) {
  const [hasSent, setHasSent] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const {
    deliveryStatus,
    sendTestMessage,
    confirmVerification,
    isSending,
    isConfirming,
    error,
    attemptCount,
  } = useVerificationStatus();

  const handleSendTest = async () => {
    try {
      await sendTestMessage();
      setHasSent(true);
      toast.success('Test message sent - check your WhatsApp!');
    } catch (e) {
      setShowTroubleshooting(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmVerification();
      toast.success('WhatsApp verified!');
      onVerified();
    } catch (e) {
      toast.error('Verification failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setShowTroubleshooting(false);
    setHasSent(false);
  };

  if (showTroubleshooting) {
    return (
      <VerificationTroubleshooting
        error={error}
        attemptCount={attemptCount}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Phone Display */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Connected Number</p>
          <p className="text-lg font-mono">{phoneNumber}</p>
        </div>

        {/* Status Badge */}
        {hasSent && (
          <div className="flex justify-center">
            <Badge variant={deliveryStatus === 'delivered' ? 'default' : 'secondary'}>
              {deliveryStatus === 'delivered' ? (
                <><CheckCircle className="w-4 h-4 mr-1" /> Delivered</>
              ) : (
                <><Send className="w-4 h-4 mr-1" /> Sent - Waiting...</>
              )}
            </Badge>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          {!hasSent ? (
            <>
              <p>We'll send a test message to verify your connection.</p>
              <p>Make sure WhatsApp is open on your phone.</p>
            </>
          ) : (
            <>
              <p>Check your WhatsApp for the test message.</p>
              <p>Click below once you've received it.</p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasSent ? (
            <Button
              className="w-full"
              onClick={handleSendTest}
              disabled={isSending}
            >
              {isSending ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Test Message</>
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="default"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> I Received It</>
              )}
            </Button>
          )}

          {hasSent && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSendTest}
              disabled={isSending}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Send Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**useVerificationStatus Hook:**

```typescript
// apps/web/src/hooks/use-verification-status.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/utils/orpc';
import { useState, useEffect } from 'react';

export function useVerificationStatus() {
  const queryClient = useQueryClient();
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Send test message mutation
  const sendMutation = useMutation({
    mutationFn: () => client.whatsapp.sendTestMessage(),
    onSuccess: (data) => {
      setDeliveryId(data.deliveryId);
      setAttemptCount((prev) => prev + 1);
    },
  });

  // Poll for delivery status (every 3 seconds when deliveryId exists)
  const statusQuery = useQuery({
    queryKey: ['whatsapp', 'verification', 'status', deliveryId],
    queryFn: () => client.whatsapp.getVerificationStatus({ deliveryId: deliveryId! }),
    enabled: !!deliveryId,
    refetchInterval: (data) => {
      // Stop polling when delivered or after 2 minutes
      if (data?.status === 'delivered') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    staleTime: 0,  // Always consider stale for polling
  });

  // Confirm verification mutation
  const confirmMutation = useMutation({
    mutationFn: () => client.whatsapp.confirmVerification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'connection'] });
    },
  });

  // Auto-stop polling after 2 minutes
  useEffect(() => {
    if (!deliveryId) return;

    const timeout = setTimeout(() => {
      queryClient.cancelQueries({ queryKey: ['whatsapp', 'verification', 'status', deliveryId] });
    }, 120_000); // 2 minutes

    return () => clearTimeout(timeout);
  }, [deliveryId, queryClient]);

  return {
    deliveryStatus: statusQuery.data?.status ?? 'pending',
    sendTestMessage: sendMutation.mutateAsync,
    confirmVerification: confirmMutation.mutateAsync,
    isSending: sendMutation.isPending,
    isConfirming: confirmMutation.isPending,
    error: sendMutation.error ?? confirmMutation.error,
    attemptCount,
  };
}
```

**WhatsApp Router Implementation:**

```typescript
// packages/api/src/routers/whatsapp.ts
import { protectedProcedure } from '../context';
import { z } from 'zod';
import { db } from '@wp-nps/db';
import { whatsappConnection } from '@wp-nps/db/schema/flowpulse';
import { eq, and } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
// Import Kapso client (inject via context or module)

export const whatsappRouter = {
  // Get current connection status
  getConnection: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

    // CRITICAL: Always filter by orgId for multi-tenancy
    return db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, orgId),
    });
  }),

  // Send test message for verification
  sendTestMessage: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

    // Get the connected WhatsApp
    const connection = await db.query.whatsappConnection.findFirst({
      where: and(
        eq(whatsappConnection.orgId, orgId),
        eq(whatsappConnection.status, 'active'),
      ),
    });

    if (!connection?.phoneNumber) {
      throw new ORPCError({
        code: 'PRECONDITION_FAILED',
        message: 'WhatsApp not connected. Please scan QR code first.',
      });
    }

    // Call Kapso to send test message
    const result = await kapsoClient.sendTestMessage({
      phoneNumber: connection.phoneNumber,
      orgId,
    });

    // Store delivery ID in metadata for tracking
    const currentMetadata = (connection.metadata as Record<string, unknown>) ?? {};
    await db.update(whatsappConnection)
      .set({
        metadata: {
          ...currentMetadata,
          lastTestDeliveryId: result.deliveryId,
          lastTestSentAt: new Date().toISOString(),
          testAttempts: ((currentMetadata.testAttempts as number) ?? 0) + 1,
        },
        updatedAt: new Date(),
      })
      .where(eq(whatsappConnection.id, connection.id));

    return {
      deliveryId: result.deliveryId,
      status: result.status,
    };
  }),

  // Get verification status (for polling)
  getVerificationStatus: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.activeOrganizationId;
      if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

      // Check Kapso for delivery status
      const status = await kapsoClient.getDeliveryStatus(input.deliveryId);

      return {
        deliveryId: input.deliveryId,
        status: status.status,
      };
    }),

  // Confirm verification manually
  confirmVerification: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new ORPCError({ code: 'UNAUTHORIZED', message: 'No active organization' });

    // Update connection status to verified
    const result = await db.update(whatsappConnection)
      .set({
        status: 'verified',
        updatedAt: new Date(),
      })
      .where(and(
        eq(whatsappConnection.orgId, orgId),
        eq(whatsappConnection.status, 'active'),
      ))
      .returning();

    if (!result[0]) {
      throw new ORPCError({
        code: 'PRECONDITION_FAILED',
        message: 'No active WhatsApp connection to verify.',
      });
    }

    return { verified: true };
  }),
};
```

### Testing Standards

**KapsoMockClient Extension for Test Messages:**

```typescript
// packages/kapso/src/mock.ts - ADD these methods
export class KapsoMockClient implements IKapsoClient {
  // ... existing code from 1.2

  private testMessageResponses: Map<string, MockResponse> = new Map();

  /**
   * Send a test message (mock implementation)
   */
  async sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult> {
    const deliveryId = `mock-test-${++this.deliveryCounter}`;

    // Record the call
    this.callHistory.push({
      params: { ...params, surveyId: 'test', message: 'Test verification message' },
      timestamp: new Date(),
      deliveryId,
    });

    // Check for specific mock response
    const mockResponse = this.testMessageResponses.get(deliveryId) ?? this.defaultResponse;

    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (mockResponse.type === 'failure' && mockResponse.error) {
      throw mockResponse.error;
    }

    return mockResponse.result ?? {
      deliveryId,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Configure test message success
   */
  mockTestMessageSuccess(deliveryId: string): void {
    this.testMessageResponses.set(deliveryId, {
      type: 'success',
      result: {
        deliveryId,
        status: 'sent',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Configure test message failure
   */
  mockTestMessageFailure(deliveryId: string, errorCode: KapsoErrorCode): void {
    this.testMessageResponses.set(deliveryId, {
      type: 'failure',
      error: new KapsoError(errorCode, `Mock test error: ${errorCode}`),
    });
  }

  /**
   * Configure delivery status as confirmed
   */
  mockDeliveryConfirmed(deliveryId: string): void {
    this.responses.set(deliveryId, {
      type: 'success',
      result: {
        deliveryId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

**Integration Test Pattern:**

```typescript
// tests/integration/whatsapp-verification.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { KapsoMockClient } from '@wp-nps/kapso';
import { db } from '@wp-nps/db';
import { whatsappConnection } from '@wp-nps/db/schema/flowpulse';
import { eq } from 'drizzle-orm';
import { createTestOrg, createActiveWhatsAppConnection } from '../utils/test-helpers';

describe('WhatsApp Verification Flow', () => {
  let kapsoClient: KapsoMockClient;

  beforeEach(() => {
    kapsoClient = new KapsoMockClient();
    kapsoClient.reset();
  });

  it('sends test message to connected phone number', async () => {
    const org = await createTestOrg('Test Corp');
    await createActiveWhatsAppConnection(org.id, '+5511999999999');

    const result = await kapsoClient.sendTestMessage({
      phoneNumber: '+5511999999999',
      orgId: org.id,
    });

    expect(result.deliveryId).toBeDefined();
    expect(result.status).toBe('sent');
    expect(kapsoClient.wasPhoneCalled('+5511999999999')).toBe(true);
  });

  it('updates status to verified on confirmation', async () => {
    const org = await createTestOrg('Test Corp');
    await createActiveWhatsAppConnection(org.id, '+5511999999999');

    // Confirm verification
    await db.update(whatsappConnection)
      .set({ status: 'verified' })
      .where(eq(whatsappConnection.orgId, org.id));

    const connection = await db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, org.id),
    });

    expect(connection?.status).toBe('verified');
  });

  it('tracks delivery status via polling', async () => {
    const org = await createTestOrg('Test Corp');
    await createActiveWhatsAppConnection(org.id, '+5511999999999');

    // Send test message
    const sendResult = await kapsoClient.sendTestMessage({
      phoneNumber: '+5511999999999',
      orgId: org.id,
    });

    // Initial status is sent
    let status = await kapsoClient.getDeliveryStatus(sendResult.deliveryId);
    expect(status.status).toBe('queued');

    // Mock delivery confirmation
    kapsoClient.mockDeliveryConfirmed(sendResult.deliveryId);

    // Status should now be delivered
    status = await kapsoClient.getDeliveryStatus(sendResult.deliveryId);
    expect(status.status).toBe('delivered');
  });

  it('handles test message failure with retry', async () => {
    const org = await createTestOrg('Test Corp');
    await createActiveWhatsAppConnection(org.id, '+5511999999999');

    // Mock failure
    kapsoClient.setDefaultResponse('failure', 'message_failed');

    await expect(
      kapsoClient.sendTestMessage({
        phoneNumber: '+5511999999999',
        orgId: org.id,
      })
    ).rejects.toThrow('message_failed');
  });

  it('enforces multi-tenant isolation', async () => {
    const org1 = await createTestOrg('Org 1');
    const org2 = await createTestOrg('Org 2');

    // Create connection for org1 only
    await createActiveWhatsAppConnection(org1.id, '+5511111111111');

    // Query as org2 should not find org1's connection
    const result = await db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, org2.id),
    });

    expect(result).toBeNull();
  });

  it('requires active connection before verification', async () => {
    const org = await createTestOrg('Test Corp');
    // No connection created

    const connection = await db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, org.id),
    });

    expect(connection).toBeNull();
    // Router would throw PRECONDITION_FAILED
  });
});
```

### UX Guidelines (from UX Specification)

**Verification Step Component:**

- Clear display of connected phone number (masked for privacy)
- Prominent "Send Test Message" button
- Status badges showing progression: Sent → Delivered
- "I Received It" confirmation button becomes primary after send
- Mobile-responsive layout with touch-friendly buttons

**Error States:**

- Use `toast.error()` for transient errors
- Show inline troubleshooting for persistent issues
- Display attempt counter: "Attempt 2 of 3"
- Clear "Try Again" and "Reconnect" actions

**Loading States:**

- Button disabled during API calls
- Spinner icon on buttons when loading
- Use `<Loader />` for full-page loading

**Success State:**

- `toast.success()` when test sent
- Badge update to "Delivered!"
- Auto-navigation after verification confirmed

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-2] Kapso Integration Package Structure
- [Source: _bmad-output/planning-artifacts/architecture.md#AR2] IKapsoClient interface abstraction
- [Source: _bmad-output/planning-artifacts/architecture.md#AR3] KapsoMockClient for testing
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3] WhatsApp Verification acceptance criteria
- [Source: _bmad-output/project-context.md#TanStack-Query] Polling with refetchInterval
- [Source: _bmad-output/project-context.md#Multi-Tenancy] orgId filtering requirements
- [Source: packages/db/src/schema/flowpulse.ts] whatsapp_connection table schema
- [Source: packages/kapso/src/types.ts] Existing IKapsoClient interface
- [Source: packages/kapso/src/mock.ts] Existing KapsoMockClient implementation

### Previous Story Intelligence

**From Story 1.0 (Foundation):**

- `whatsapp_connection` table already created with proper schema
- KapsoMockClient class exists with basic structure
- RLS policies enabled on all tenant-scoped tables
- Test infrastructure (Vitest to be installed) configured

**From Story 1.1 (Registration):**

- Better Auth organization plugin configured
- Session provides `activeOrganizationId` for multi-tenancy
- Sign-up form pattern with TanStack Form established
- Onboarding route structure started

**From Story 1.2 (QR Connection):**

- IKapsoClient interface extended with QR types
- KapsoMockClient extended with QR mocking
- whatsappRouter NOT created yet (this story creates it)
- QRScanner component created
- Onboarding routes structure exists
- Connection status polling pattern established

### Latest Technical Specifics

**TanStack Query Polling (v5.90.12):**

- Use `refetchInterval` option for polling
- Return `false` from `refetchInterval` function to stop polling
- Use `enabled` option to conditionally enable queries
- Set `staleTime: 0` for polling queries to always refetch

**Kapso API Integration Notes:**

- Test message uses same delivery tracking as survey sends
- Delivery status: 'queued' → 'sent' → 'delivered' → 'read'
- Poll every 3 seconds for responsive UX
- Stop polling after 2 minutes to prevent infinite loops

**shadcn/ui Components to Use:**

- `Card`, `CardHeader`, `CardContent` for container
- `Button` for actions (primary and outline variants)
- `Badge` for status display (default and secondary)
- Import icons from `lucide-react`: CheckCircle, Send, RefreshCw, AlertCircle

**Phone Number Masking:**

```typescript
function maskPhone(phone: string): string {
  // +5511999999999 → +55 ** *** **99
  if (phone.length < 6) return phone;
  const last2 = phone.slice(-2);
  const masked = phone.slice(0, 3) + ' ** *** **' + last2;
  return masked;
}
```

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

1. Extended IKapsoClient interface with `sendTestMessage` method and new error codes (`test_message_failed`, `phone_not_connected`)
2. Implemented KapsoMockClient with test message mocking including `mockTestMessageSuccess`, `mockTestMessageFailure`, and `mockDeliveryConfirmed` helpers
3. Added verification procedures to whatsappRouter: `sendTestMessage`, `getVerificationStatus`, `confirmVerification`
4. All procedures enforce multi-tenancy by filtering on `session.activeOrganizationId`
5. Created VerificationStep component with phone masking, status badges, and loading states
6. Implemented useVerificationStatus hook with 3-second polling and 2-minute timeout
7. Created VerificationTroubleshooting component with max 3 attempts, user-friendly errors, and troubleshooting tips
8. Updated onboarding.tsx route to include verify step and auto-detect connection status
9. Added 12 new integration tests covering verification flow, error handling, and multi-tenant isolation
10. All 111 tests passing (including 30 WhatsApp connection/verification tests)

### Senior Developer Review (AI)

**Review Date:** 2025-12-27
**Reviewer:** Code Review Agent
**Outcome:** Approved with fixes applied

**Issues Found and Fixed:**

1. **HIGH - ORPCError Usage** (packages/api/src/routers/whatsapp.ts): Replaced 15 generic `throw new Error()` calls with proper `throw new ORPCError("CODE", { message: "..." })` pattern per project oRPC conventions
2. **MEDIUM - Unstaged Files**: Staged 3 new files that were untracked (verification-step.tsx, verification-troubleshooting.tsx, use-verification-status.ts)

**Verification:**

- All 30 WhatsApp connection/verification tests passing
- TypeScript compilation successful
- All ACs validated as implemented

### Change Log

| Change                                                                    | File(s)                                                             | Reason                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| [Review Fix] Replaced Error with ORPCError for proper oRPC error handling | packages/api/src/routers/whatsapp.ts                                | Code review - project standards compliance  |
| Added SendTestParams type and sendTestMessage to IKapsoClient             | packages/kapso/src/types.ts                                         | AC #1 - Enable test message API             |
| Added test_message_failed, phone_not_connected error codes                | packages/kapso/src/types.ts                                         | AC #3 - Error handling                      |
| Implemented sendTestMessage mock and helpers                              | packages/kapso/src/mock.ts                                          | AC #1, #4 - Mock implementation for testing |
| Added unit tests for test message methods                                 | packages/kapso/src/mock.test.ts                                     | Task 2.5 - Unit test coverage               |
| Added verification procedures to whatsappRouter                           | packages/api/src/routers/whatsapp.ts                                | AC #1, #2, #4 - API endpoints               |
| Created VerificationStep component                                        | apps/web/src/components/onboarding/verification-step.tsx            | AC #1, #2, #4, #5 - Verification UI         |
| Created VerificationTroubleshooting component                             | apps/web/src/components/onboarding/verification-troubleshooting.tsx | AC #3 - Error handling UI                   |
| Created useVerificationStatus hook                                        | apps/web/src/hooks/use-verification-status.ts                       | AC #4 - Status polling                      |
| Updated onboarding route with verify step                                 | apps/web/src/routes/onboarding.tsx                                  | AC #1, #2, #3, #5 - Onboarding flow         |
| Added verification integration tests                                      | tests/integration/whatsapp-connection.test.ts                       | Task 9 - Test coverage                      |

### File List

**New Files:**

- apps/web/src/components/onboarding/verification-step.tsx
- apps/web/src/components/onboarding/verification-troubleshooting.tsx
- apps/web/src/hooks/use-verification-status.ts

**Modified Files:**

- packages/kapso/src/types.ts
- packages/kapso/src/mock.ts
- packages/kapso/src/mock.test.ts
- packages/api/src/routers/whatsapp.ts
- apps/web/src/routes/onboarding.tsx
- tests/integration/whatsapp-connection.test.ts
- \_bmad-output/implementation-artifacts/sprint-status.yaml
