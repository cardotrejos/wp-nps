# Story 1.2: WhatsApp Connection via QR Code

Status: ready-for-dev

## Story

As a **Business Owner**,
I want to **connect my WhatsApp Business number by scanning a QR code**,
so that **FlowPulse can send surveys on my behalf**.

## Acceptance Criteria

1. **Given** I am logged in and on the WhatsApp connection step **When** I view the QR code screen **Then** I see a QR code from Kapso with clear scan instructions **And** a 60-second countdown timer is visible (UX6) **And** a progress stepper shows my current step (UX7)

2. **Given** I scan the QR code with my WhatsApp Business app **When** the connection is established **Then** I see a "Connected!" success message **And** my WhatsApp number is stored (encrypted at rest - NFR-S2) **And** the connection status updates to "active"

3. **Given** 60 seconds pass without a successful scan **When** the timeout occurs **Then** I see troubleshooting tips (UX6) **And** a "Retry" button generates a fresh QR code

4. **Given** I am polling for connection status **When** Kapso confirms the WhatsApp link **Then** the UI updates automatically without page refresh **And** the countdown timer stops

5. **Given** I am on mobile **When** I view the QR code screen **Then** I see instructions to open WhatsApp Web linking on another device **Or** I see a deep link option to connect via mobile flow

## Tasks / Subtasks

- [ ] Task 1: Extend IKapsoClient Interface for QR Code Operations (AC: #1)
  - [ ] 1.1 Add `getQRCode(orgId: string): Promise<QRCodeResult>` method to `IKapsoClient` interface
  - [ ] 1.2 Add `checkConnectionStatus(orgId: string): Promise<ConnectionStatus>` method to interface
  - [ ] 1.3 Define `QRCodeResult` type with `qrCodeUrl`, `expiresAt`, `sessionId` fields
  - [ ] 1.4 Define `ConnectionStatus` type with `status`, `phoneNumber`, `connectedAt` fields
  - [ ] 1.5 Add QR code related error codes to `KapsoErrorCode`: `qr_expired`, `qr_generation_failed`

- [ ] Task 2: Implement KapsoMockClient QR Methods (AC: #1, #3, #4)
  - [ ] 2.1 Implement `getQRCode()` mock that returns configurable QR code URL
  - [ ] 2.2 Implement `checkConnectionStatus()` mock with configurable states
  - [ ] 2.3 Add `mockQRCode(sessionId, qrUrl)` helper method
  - [ ] 2.4 Add `mockConnectionSuccess(sessionId, phoneNumber)` helper method
  - [ ] 2.5 Add `mockConnectionTimeout(sessionId)` helper method
  - [ ] 2.6 Write unit tests for all new mock methods

- [ ] Task 3: Create WhatsApp Connection API Router (AC: #1, #2, #4)
  - [ ] 3.1 Create `packages/api/src/routers/whatsapp.ts` with `whatsappRouter`
  - [ ] 3.2 Implement `whatsapp.getQRCode` protected procedure
  - [ ] 3.3 Implement `whatsapp.checkStatus` protected procedure
  - [ ] 3.4 Implement `whatsapp.disconnect` protected procedure (for future use)
  - [ ] 3.5 Add `whatsappRouter` to main router in `packages/api/src/routers/index.ts`
  - [ ] 3.6 Ensure ALL procedures filter by `orgId` from session (multi-tenancy)

- [ ] Task 4: Implement WhatsApp Connection Service Logic (AC: #2)
  - [ ] 4.1 Create QR code fetch logic that calls Kapso API
  - [ ] 4.2 On connection success, create/update `whatsapp_connection` record
  - [ ] 4.3 Store phone number with encryption consideration (NFR-S2 - application note)
  - [ ] 4.4 Update connection status to "active" and set `connectedAt`
  - [ ] 4.5 Store Kapso session ID in `kapsoId` field

- [ ] Task 5: Create QRScanner Component (AC: #1, #3, #5)
  - [ ] 5.1 Create `apps/web/src/components/onboarding/qr-scanner.tsx`
  - [ ] 5.2 Display QR code image from Kapso API response
  - [ ] 5.3 Implement 60-second countdown timer with visual indicator
  - [ ] 5.4 Show clear scan instructions next to QR code
  - [ ] 5.5 Add "Refresh QR Code" button for timeout/manual refresh
  - [ ] 5.6 Show mobile-specific instructions when on mobile viewport

- [ ] Task 6: Implement Connection Status Polling (AC: #4)
  - [ ] 6.1 Create `useWhatsAppConnection` hook in `apps/web/src/hooks/use-whatsapp-connection.ts`
  - [ ] 6.2 Implement TanStack Query with `refetchInterval: 3000` (3s polling)
  - [ ] 6.3 Stop polling when status becomes "active" or timer expires
  - [ ] 6.4 Update UI reactively when connection established
  - [ ] 6.5 Handle error states gracefully with retry option

- [ ] Task 7: Create Timeout and Troubleshooting UI (AC: #3)
  - [ ] 7.1 Create `apps/web/src/components/onboarding/qr-troubleshooting.tsx`
  - [ ] 7.2 Display troubleshooting tips: "Make sure WhatsApp is open", "Check internet connection"
  - [ ] 7.3 Add "Generate New QR Code" button that refreshes QR
  - [ ] 7.4 Show help link to WhatsApp Business documentation
  - [ ] 7.5 Animate transition between QR and troubleshooting states

- [ ] Task 8: Create Onboarding WhatsApp Connection Route (AC: #1, #2, #3, #5)
  - [ ] 8.1 Create `apps/web/src/routes/_authenticated/onboarding/whatsapp.tsx`
  - [ ] 8.2 Integrate QRScanner component
  - [ ] 8.3 Integrate ProgressStepper showing step 2 of onboarding
  - [ ] 8.4 Handle success state with celebration message and navigation
  - [ ] 8.5 Handle loading states with `<Loader />`

- [ ] Task 9: Write Integration Tests (AC: #1, #2, #3, #4)
  - [ ] 9.1 Test QR code generation returns valid URL
  - [ ] 9.2 Test connection status polling detects successful connection
  - [ ] 9.3 Test timeout triggers troubleshooting UI
  - [ ] 9.4 Test whatsapp_connection record is created on success
  - [ ] 9.5 Test multi-tenant isolation (org A cannot see org B's connection)

## Dev Notes

### Critical Architecture Compliance

**Kapso Integration Package (AR2):**
The Kapso package already exists at `packages/kapso/` with `IKapsoClient` interface. This story extends it with QR code operations. The real `KapsoClient` implementation will be created, and `KapsoMockClient` must be extended for testing.

```typescript
// packages/kapso/src/types.ts - EXTEND with QR code types
export interface QRCodeResult {
  qrCodeUrl: string;      // URL to QR code image
  sessionId: string;      // Kapso session identifier
  expiresAt: string;      // ISO timestamp when QR expires
}

export interface ConnectionStatus {
  status: 'pending' | 'connected' | 'failed' | 'expired';
  phoneNumber?: string;   // Set when connected
  connectedAt?: string;   // ISO timestamp
  error?: string;         // Error message if failed
}

// Add to IKapsoClient interface
export interface IKapsoClient {
  // ... existing methods
  getQRCode(orgId: string): Promise<QRCodeResult>;
  checkConnectionStatus(sessionId: string): Promise<ConnectionStatus>;
}
```

**WhatsApp Connection Table Schema (Already Created in 1.0):**
```typescript
// packages/db/src/schema/flowpulse.ts - whatsappConnection table
// Fields: id, orgId, phoneNumber, status, kapsoId, connectedAt, lastSeenAt, metadata
// Status values: 'pending', 'active', 'disconnected', 'failed'
```

**Multi-Tenancy Enforcement (AR8, AR11):**
```typescript
// EVERY query MUST include orgId filter
const connection = await db.query.whatsappConnection.findFirst({
  where: eq(whatsappConnection.orgId, ctx.session.activeOrganizationId),
});
```

### Project Structure Notes

**Files to Create:**
- `packages/kapso/src/client.ts` - Real KapsoClient implementation (scaffold)
- `packages/api/src/routers/whatsapp.ts` - WhatsApp connection router
- `apps/web/src/components/onboarding/qr-scanner.tsx` - QR code display component
- `apps/web/src/components/onboarding/qr-troubleshooting.tsx` - Timeout/error UI
- `apps/web/src/hooks/use-whatsapp-connection.ts` - Connection status hook
- `apps/web/src/routes/_authenticated/onboarding/whatsapp.tsx` - Onboarding step route
- `tests/integration/whatsapp-connection.test.ts` - Integration tests

**Files to Modify:**
- `packages/kapso/src/types.ts` - Add QR code types and methods to interface
- `packages/kapso/src/mock.ts` - Add QR code mock methods
- `packages/kapso/src/index.ts` - Export new types
- `packages/api/src/routers/index.ts` - Add whatsappRouter

**Dependencies:**
- No new dependencies required
- Uses existing: TanStack Query, TanStack Router, shadcn/ui

**Naming Conventions:**
- Component files: kebab-case (`qr-scanner.tsx`)
- Component exports: PascalCase (`QRScanner`)
- Hook files: kebab-case with use- prefix (`use-whatsapp-connection.ts`)
- Router files: kebab-case (`whatsapp.ts`)
- Test files: kebab-case with .test suffix (`whatsapp-connection.test.ts`)

### Component Implementation Patterns

**QRScanner Component Structure:**
```typescript
// apps/web/src/components/onboarding/qr-scanner.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWhatsAppConnection } from '@/hooks/use-whatsapp-connection';
import Loader from '@/components/loader';
import { QRTroubleshooting } from './qr-troubleshooting';

const QR_TIMEOUT_SECONDS = 60;

export function QRScanner({ onConnected }: { onConnected: () => void }) {
  const [timeRemaining, setTimeRemaining] = useState(QR_TIMEOUT_SECONDS);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const {
    qrCodeUrl,
    status,
    isLoading,
    error,
    refetchQRCode,
  } = useWhatsAppConnection();

  // Countdown timer
  useEffect(() => {
    if (status === 'connected') {
      onConnected();
      return;
    }

    if (timeRemaining <= 0) {
      setShowTroubleshooting(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, status, onConnected]);

  const handleRefresh = () => {
    setTimeRemaining(QR_TIMEOUT_SECONDS);
    setShowTroubleshooting(false);
    refetchQRCode();
  };

  if (isLoading) return <Loader />;

  if (showTroubleshooting) {
    return <QRTroubleshooting onRetry={handleRefresh} />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect WhatsApp Business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="WhatsApp QR Code"
              className="w-64 h-64 border rounded-lg"
            />
          ) : (
            <div className="w-64 h-64 bg-muted rounded-lg animate-pulse" />
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>1. Open WhatsApp on your phone</p>
          <p>2. Go to Settings → Linked Devices</p>
          <p>3. Tap "Link a Device" and scan this code</p>
        </div>

        {/* Countdown Timer */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Time remaining</span>
            <span className={timeRemaining <= 10 ? 'text-destructive' : ''}>
              {timeRemaining}s
            </span>
          </div>
          <Progress value={(timeRemaining / QR_TIMEOUT_SECONDS) * 100} />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleRefresh}
        >
          Refresh QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
```

**useWhatsAppConnection Hook:**
```typescript
// apps/web/src/hooks/use-whatsapp-connection.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/utils/orpc';

export function useWhatsAppConnection() {
  const queryClient = useQueryClient();

  // Fetch QR code
  const qrQuery = useQuery({
    queryKey: ['whatsapp', 'qr'],
    queryFn: () => client.whatsapp.getQRCode(),
    staleTime: 55_000, // QR valid for ~60s
  });

  // Poll for connection status (every 3 seconds)
  const statusQuery = useQuery({
    queryKey: ['whatsapp', 'status', qrQuery.data?.sessionId],
    queryFn: () => client.whatsapp.checkStatus({
      sessionId: qrQuery.data?.sessionId ?? '',
    }),
    enabled: !!qrQuery.data?.sessionId,
    refetchInterval: (data) => {
      // Stop polling when connected or failed
      if (data?.status === 'connected' || data?.status === 'failed') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
  });

  const refetchQRCode = () => {
    queryClient.invalidateQueries({ queryKey: ['whatsapp', 'qr'] });
  };

  return {
    qrCodeUrl: qrQuery.data?.qrCodeUrl,
    sessionId: qrQuery.data?.sessionId,
    status: statusQuery.data?.status ?? 'pending',
    phoneNumber: statusQuery.data?.phoneNumber,
    isLoading: qrQuery.isPending,
    error: qrQuery.error ?? statusQuery.error,
    refetchQRCode,
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
// Import Kapso client (inject via context or module)

export const whatsappRouter = {
  getQRCode: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new Error('No active organization');

    // Call Kapso to generate QR code
    const kapsoResult = await kapsoClient.getQRCode(orgId);

    // Create/update pending connection record
    await db.insert(whatsappConnection)
      .values({
        orgId,
        status: 'pending',
        kapsoId: kapsoResult.sessionId,
      })
      .onConflictDoUpdate({
        target: whatsappConnection.orgId,
        set: {
          status: 'pending',
          kapsoId: kapsoResult.sessionId,
          updatedAt: new Date(),
        },
      });

    return {
      qrCodeUrl: kapsoResult.qrCodeUrl,
      sessionId: kapsoResult.sessionId,
      expiresAt: kapsoResult.expiresAt,
    };
  }),

  checkStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.activeOrganizationId;
      if (!orgId) throw new Error('No active organization');

      // Check Kapso for connection status
      const kapsoStatus = await kapsoClient.checkConnectionStatus(input.sessionId);

      // If connected, update our database
      if (kapsoStatus.status === 'connected' && kapsoStatus.phoneNumber) {
        await db.update(whatsappConnection)
          .set({
            status: 'active',
            phoneNumber: kapsoStatus.phoneNumber,
            connectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(
            eq(whatsappConnection.orgId, orgId),
            eq(whatsappConnection.kapsoId, input.sessionId),
          ));
      }

      return kapsoStatus;
    }),

  getConnection: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.activeOrganizationId;
    if (!orgId) throw new Error('No active organization');

    // CRITICAL: Always filter by orgId for multi-tenancy
    return db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, orgId),
    });
  }),
};
```

### Testing Standards

**KapsoMockClient Extension for QR Testing:**
```typescript
// packages/kapso/src/mock.ts - ADD these methods
export class KapsoMockClient implements IKapsoClient {
  // ... existing code

  private qrCodes: Map<string, QRCodeResult> = new Map();
  private connectionStatuses: Map<string, ConnectionStatus> = new Map();

  mockQRCode(sessionId: string, qrCodeUrl: string): void {
    this.qrCodes.set(sessionId, {
      qrCodeUrl,
      sessionId,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    this.connectionStatuses.set(sessionId, { status: 'pending' });
  }

  mockConnectionSuccess(sessionId: string, phoneNumber: string): void {
    this.connectionStatuses.set(sessionId, {
      status: 'connected',
      phoneNumber,
      connectedAt: new Date().toISOString(),
    });
  }

  mockConnectionTimeout(sessionId: string): void {
    this.connectionStatuses.set(sessionId, {
      status: 'expired',
      error: 'QR code expired',
    });
  }

  async getQRCode(orgId: string): Promise<QRCodeResult> {
    const sessionId = `mock-session-${orgId}-${Date.now()}`;
    const result: QRCodeResult = {
      qrCodeUrl: `https://mock-kapso.test/qr/${sessionId}.png`,
      sessionId,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    this.qrCodes.set(sessionId, result);
    this.connectionStatuses.set(sessionId, { status: 'pending' });
    return result;
  }

  async checkConnectionStatus(sessionId: string): Promise<ConnectionStatus> {
    return this.connectionStatuses.get(sessionId) ?? { status: 'pending' };
  }
}
```

**Integration Test Pattern:**
```typescript
// tests/integration/whatsapp-connection.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { KapsoMockClient } from '@wp-nps/kapso';
import { db } from '@wp-nps/db';
import { whatsappConnection } from '@wp-nps/db/schema/flowpulse';
import { eq } from 'drizzle-orm';
import { createTestOrg } from '../utils/test-org';

describe('WhatsApp Connection Flow', () => {
  let kapsoClient: KapsoMockClient;

  beforeEach(() => {
    kapsoClient = new KapsoMockClient();
  });

  it('generates QR code and creates pending connection record', async () => {
    const org = await createTestOrg('Test Corp');
    const qr = await kapsoClient.getQRCode(org.id);

    expect(qr.qrCodeUrl).toContain('mock-kapso.test/qr/');
    expect(qr.sessionId).toBeDefined();
    expect(qr.expiresAt).toBeDefined();
  });

  it('updates connection to active when scan succeeds', async () => {
    const org = await createTestOrg('Test Corp');
    const qr = await kapsoClient.getQRCode(org.id);

    // Simulate successful scan
    kapsoClient.mockConnectionSuccess(qr.sessionId, '+5511999999999');
    const status = await kapsoClient.checkConnectionStatus(qr.sessionId);

    expect(status.status).toBe('connected');
    expect(status.phoneNumber).toBe('+5511999999999');
  });

  it('returns expired status after timeout', async () => {
    const org = await createTestOrg('Test Corp');
    const qr = await kapsoClient.getQRCode(org.id);

    // Simulate timeout
    kapsoClient.mockConnectionTimeout(qr.sessionId);
    const status = await kapsoClient.checkConnectionStatus(qr.sessionId);

    expect(status.status).toBe('expired');
    expect(status.error).toBe('QR code expired');
  });

  it('enforces multi-tenant isolation', async () => {
    const org1 = await createTestOrg('Org 1');
    const org2 = await createTestOrg('Org 2');

    // Create connection for org1
    await db.insert(whatsappConnection).values({
      orgId: org1.id,
      status: 'active',
      phoneNumber: '+5511111111111',
    });

    // Query as org2 should not find org1's connection
    const result = await db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, org2.id),
    });

    expect(result).toBeNull();
  });
});
```

### UX Guidelines (from UX Specification)

**QR Scanner Component (UX6):**
- 60-second countdown timer with visual progress bar
- Clear step-by-step instructions
- Troubleshooting tips on timeout
- Mobile-responsive design

**Progress Stepper (UX7):**
- Already created in Story 1.0/1.1
- Show step 2 of onboarding (WhatsApp Connection)
- Steps: 1) Account → 2) WhatsApp → 3) Template → 4) Complete

**Loading States:**
- Use `<Loader />` component for pending states
- Show skeleton UI for QR code while loading
- 1s minimum display for loading states (UX12)

**Success State:**
- Show "Connected!" with checkmark animation
- Display connected phone number (masked: +55 ** *** **99)
- Auto-navigate to next step after 2 seconds

**Error Handling:**
- Use `toast.error()` for API errors
- Show inline error messages for recoverable errors
- Provide clear "Try Again" actions

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-2] Kapso Integration Package Structure
- [Source: _bmad-output/planning-artifacts/architecture.md#AR2] IKapsoClient interface abstraction
- [Source: _bmad-output/planning-artifacts/architecture.md#AR3] KapsoMockClient for testing
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2] WhatsApp Connection acceptance criteria
- [Source: _bmad-output/project-context.md#TanStack-Query] Polling with refetchInterval
- [Source: _bmad-output/project-context.md#Multi-Tenancy] orgId filtering requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX6] QRScanner component spec
- [Source: packages/db/src/schema/flowpulse.ts] whatsapp_connection table schema
- [Source: packages/kapso/src/types.ts] Existing IKapsoClient interface

### Previous Story Intelligence

**From Story 1.0 (Foundation):**
- `whatsapp_connection` table already created with proper schema
- KapsoMockClient class exists with basic structure
- RLS policies enabled on all tenant-scoped tables
- Test infrastructure (Vitest, MSW) configured

**From Story 1.1 (Registration):**
- Better Auth organization plugin configured
- Session provides `activeOrganizationId` for multi-tenancy
- Sign-up form pattern with TanStack Form established
- Onboarding route structure started

### Latest Technical Specifics

**TanStack Query Polling (v5.90.12):**
- Use `refetchInterval` option for polling
- Return `false` from `refetchInterval` function to stop polling
- Use `enabled` option to conditionally enable queries

**Kapso API Integration Notes:**
- QR code endpoint returns image URL (not base64)
- Connection status polling should be 2-5 seconds interval
- Session IDs are used to track individual QR code sessions
- Phone numbers returned in E.164 format (+5511999999999)

**shadcn/ui Components to Use:**
- `Card`, `CardHeader`, `CardContent` for QR container
- `Button` for refresh action
- `Progress` for countdown timer visualization
- Consider `Skeleton` for loading state

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log
| Change | File(s) | Reason |
|--------|---------|--------|

### File List
