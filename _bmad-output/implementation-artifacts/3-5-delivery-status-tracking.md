# Story 3.5: Delivery Status Tracking

Status: ready-for-dev

## Story

As a **Business Owner**,
I want to **view the delivery status of my sent surveys**,
So that **I know which customers received the survey**.

## Acceptance Criteria

1. **Given** I am on the survey detail page **When** I click "Deliveries" tab **Then** I see a list of all delivery attempts **And** each shows: phone (masked), status, timestamp, metadata

2. **Given** a delivery failed **When** I view its status **Then** I see "Failed" with the error reason **And** I see retry count (e.g., "2/2 retries exhausted")

3. **Given** I have many deliveries **When** I scroll the list **Then** deliveries are paginated (20 per page) **And** I can filter by status

4. **Given** I view a delivery **When** checking the phone number **Then** only last 4 digits are visible (e.g., "+55***...1234")

5. **Given** I want to see delivery details **When** I click on a delivery row **Then** I see expanded details including full metadata and timestamps

## Tasks / Subtasks

- [ ] Task 1: Create Delivery List Router (AC: #1, #2, #3)
  - [ ] 1.1 Add `delivery` router to `packages/api/src/routers/delivery.ts`
  - [ ] 1.2 Implement `list` procedure with surveyId filter and pagination
  - [ ] 1.3 Implement `getById` procedure for delivery details
  - [ ] 1.4 Add status filter parameter
  - [ ] 1.5 Ensure org_id filtering (multi-tenancy)

- [ ] Task 2: Create Phone Masking Utility (AC: #4)
  - [ ] 2.1 Create `packages/api/src/utils/phone-mask.ts`
  - [ ] 2.2 Implement `maskPhoneNumber(phone)` - shows country code + last 4
  - [ ] 2.3 Use in delivery list response

- [ ] Task 3: Create Delivery List UI Component (AC: #1, #2, #3, #4)
  - [ ] 3.1 Create `apps/web/src/components/surveys/delivery-list.tsx`
  - [ ] 3.2 Display deliveries in table/list format
  - [ ] 3.3 Show status badges with colors
  - [ ] 3.4 Show masked phone numbers
  - [ ] 3.5 Add pagination controls

- [ ] Task 4: Create Delivery Status Badge Component (AC: #1, #2)
  - [ ] 4.1 Create `apps/web/src/components/surveys/delivery-status-badge.tsx`
  - [ ] 4.2 Map status to colors (pending=gray, sent=blue, delivered=green, failed=red)
  - [ ] 4.3 Show retry count for failed deliveries

- [ ] Task 5: Create Delivery Detail Panel (AC: #5)
  - [ ] 5.1 Create `apps/web/src/components/surveys/delivery-detail.tsx`
  - [ ] 5.2 Show full metadata in JSON format
  - [ ] 5.3 Show all timestamps (created, sent, delivered, responded)
  - [ ] 5.4 Show error message if failed

- [ ] Task 6: Integrate with Survey Detail Page (AC: #1)
  - [ ] 6.1 Add "Deliveries" tab to survey detail page
  - [ ] 6.2 Load delivery list on tab selection
  - [ ] 6.3 Add status filter dropdown

- [ ] Task 7: Write Tests (AC: #1, #2, #3, #4)
  - [ ] 7.1 Create `tests/integration/delivery-tracking.test.ts`
  - [ ] 7.2 Test delivery list with pagination
  - [ ] 7.3 Test status filtering
  - [ ] 7.4 Test phone masking
  - [ ] 7.5 Test multi-tenant isolation

## Dev Notes

### Critical Architecture Compliance

**This story implements FR17, FR18 (delivery status tracking and viewing).**

From architecture.md:
- All queries must include `org_id` filter
- Phone masking for PII protection
- Pagination for large datasets

### Previous Story Context

Story 3-3 and 3-4 established:
- `survey_delivery` table with status field
- Statuses: pending, queued, sent, delivered, failed, undeliverable, responded
- `kapso_message_id` for tracking
- Error messages stored on failure

### Phone Masking Utility

```typescript
// packages/api/src/utils/phone-mask.ts

/**
 * Masks a phone number for display.
 * Shows country code and last 4 digits.
 * Example: +5511999999999 -> +55*****9999
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) {
    return '****';
  }
  
  // E.164 format: +[country][number]
  const countryCodeMatch = phone.match(/^\+(\d{1,3})/);
  const countryCode = countryCodeMatch ? countryCodeMatch[0] : '';
  const lastFour = phone.slice(-4);
  const maskedLength = phone.length - countryCode.length - 4;
  
  return `${countryCode}${'*'.repeat(maskedLength)}${lastFour}`;
}
```

### Delivery Router

```typescript
// packages/api/src/routers/delivery.ts
import { z } from 'zod';
import { protectedProcedure } from '../trpc';
import { db } from '@wp-nps/db';
import { surveyDelivery, survey } from '@wp-nps/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { maskPhoneNumber } from '../utils/phone-mask';

const deliveryStatusSchema = z.enum([
  'pending', 'queued', 'sent', 'delivered', 'failed', 'undeliverable', 'responded'
]);

export const deliveryRouter = {
  list: protectedProcedure
    .input(z.object({
      surveyId: z.string(),
      status: deliveryStatusSchema.optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.session.activeOrganizationId;
      const offset = (input.page - 1) * input.pageSize;
      
      // Build where clause
      const conditions = [
        eq(surveyDelivery.orgId, orgId),
        eq(surveyDelivery.surveyId, input.surveyId),
      ];
      
      if (input.status) {
        conditions.push(eq(surveyDelivery.status, input.status));
      }
      
      // Get deliveries
      const deliveries = await db.query.surveyDelivery.findMany({
        where: and(...conditions),
        orderBy: desc(surveyDelivery.createdAt),
        limit: input.pageSize,
        offset,
      });
      
      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(surveyDelivery)
        .where(and(...conditions));
      
      return {
        items: deliveries.map(d => ({
          id: d.id,
          phoneNumberMasked: maskPhoneNumber(d.phoneNumber),
          status: d.status,
          metadata: d.metadata,
          errorMessage: d.errorMessage,
          createdAt: d.createdAt,
          deliveredAt: d.deliveredAt,
          respondedAt: d.respondedAt,
        })),
        total: Number(count),
        page: input.page,
        pageSize: input.pageSize,
        hasMore: offset + deliveries.length < Number(count),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.session.activeOrganizationId;
      
      const delivery = await db.query.surveyDelivery.findFirst({
        where: and(
          eq(surveyDelivery.id, input.id),
          eq(surveyDelivery.orgId, orgId),
        ),
      });
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      return {
        ...delivery,
        phoneNumberMasked: maskPhoneNumber(delivery.phoneNumber),
      };
    }),
};
```

### Delivery List Component

```typescript
// apps/web/src/components/surveys/delivery-list.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DeliveryStatusBadge } from './delivery-status-badge';
import { DeliveryDetailPanel } from './delivery-detail';
import { deliveryKeys } from '@wp-nps/shared/query-keys';
import { client } from '@/utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DeliveryListProps {
  surveyId: string;
}

export function DeliveryList({ surveyId }: DeliveryListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const { data, isPending } = useQuery({
    queryKey: deliveryKeys.list(surveyId, { page, status: statusFilter }),
    queryFn: () => client.delivery.list({ surveyId, page, status: statusFilter }),
  });
  
  if (isPending) {
    return <div className="animate-pulse">Loading deliveries...</div>;
  }
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter ?? 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground">
          {data?.total ?? 0} deliveries
        </span>
      </div>
      
      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Metadata</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((delivery) => (
            <TableRow 
              key={delivery.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedId(delivery.id)}
            >
              <TableCell className="font-mono text-sm">
                {delivery.phoneNumberMasked}
              </TableCell>
              <TableCell>
                <DeliveryStatusBadge 
                  status={delivery.status} 
                  errorMessage={delivery.errorMessage}
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(delivery.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm">
                {delivery.metadata?.customer_name ?? '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Page {page} of {Math.ceil((data?.total ?? 0) / 20)}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasMore}
          onClick={() => setPage(p => p + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Detail Panel */}
      {selectedId && (
        <DeliveryDetailPanel 
          deliveryId={selectedId} 
          onClose={() => setSelectedId(null)} 
        />
      )}
    </div>
  );
}
```

### Delivery Status Badge

```typescript
// apps/web/src/components/surveys/delivery-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Check, Clock, Send, X, MessageSquare } from 'lucide-react';

interface DeliveryStatusBadgeProps {
  status: string;
  errorMessage?: string | null;
  retryCount?: number;
  maxRetries?: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  queued: { label: 'Queued', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  sent: { label: 'Sent', variant: 'outline', icon: <Send className="h-3 w-3" /> },
  delivered: { label: 'Delivered', variant: 'default', icon: <Check className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  undeliverable: { label: 'Undeliverable', variant: 'destructive', icon: <X className="h-3 w-3" /> },
  responded: { label: 'Responded', variant: 'default', icon: <MessageSquare className="h-3 w-3" /> },
};

export function DeliveryStatusBadge({ status, errorMessage, retryCount, maxRetries }: DeliveryStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'secondary', icon: null };
  
  const badge = (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
      {retryCount !== undefined && maxRetries !== undefined && status === 'failed' && (
        <span className="text-xs">({retryCount}/{maxRetries})</span>
      )}
    </Badge>
  );
  
  if (errorMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{errorMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return badge;
}
```

### Test Patterns

```typescript
// tests/integration/delivery-tracking.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { db } from '@wp-nps/db';
import { survey, surveyDelivery } from '@wp-nps/db/schema';
import { maskPhoneNumber } from '@wp-nps/api/utils/phone-mask';

describe('Delivery Status Tracking', () => {
  let testOrg: { id: string };
  let testSurvey: { id: string };

  beforeEach(async () => {
    testOrg = await createTestOrg();
    
    const [s] = await db.insert(survey).values({
      orgId: testOrg.id,
      name: 'Test Survey',
      type: 'nps',
      status: 'active',
    }).returning();
    testSurvey = s;
  });

  describe('maskPhoneNumber', () => {
    it('masks phone number correctly', () => {
      expect(maskPhoneNumber('+5511999999999')).toBe('+55*******9999');
      expect(maskPhoneNumber('+14155551234')).toBe('+1*******1234');
    });
  });

  describe('delivery list', () => {
    it('returns paginated deliveries', async () => {
      // Create 25 deliveries
      for (let i = 0; i < 25; i++) {
        await db.insert(surveyDelivery).values({
          orgId: testOrg.id,
          surveyId: testSurvey.id,
          phoneNumber: `+551199999${String(i).padStart(4, '0')}`,
          phoneNumberHash: `hash${i}`,
          status: 'sent',
        });
      }
      
      const response = await client.delivery.list({
        surveyId: testSurvey.id,
        page: 1,
        pageSize: 20,
      });
      
      expect(response.items).toHaveLength(20);
      expect(response.total).toBe(25);
      expect(response.hasMore).toBe(true);
    });

    it('filters by status', async () => {
      await db.insert(surveyDelivery).values([
        { orgId: testOrg.id, surveyId: testSurvey.id, phoneNumber: '+5511999990001', phoneNumberHash: 'h1', status: 'sent' },
        { orgId: testOrg.id, surveyId: testSurvey.id, phoneNumber: '+5511999990002', phoneNumberHash: 'h2', status: 'failed' },
        { orgId: testOrg.id, surveyId: testSurvey.id, phoneNumber: '+5511999990003', phoneNumberHash: 'h3', status: 'sent' },
      ]);
      
      const response = await client.delivery.list({
        surveyId: testSurvey.id,
        status: 'failed',
      });
      
      expect(response.items).toHaveLength(1);
      expect(response.items[0]?.status).toBe('failed');
    });

    it('masks phone numbers in response', async () => {
      await db.insert(surveyDelivery).values({
        orgId: testOrg.id,
        surveyId: testSurvey.id,
        phoneNumber: '+5511999999999',
        phoneNumberHash: 'hash',
        status: 'sent',
      });
      
      const response = await client.delivery.list({ surveyId: testSurvey.id });
      
      expect(response.items[0]?.phoneNumberMasked).toBe('+55*******9999');
    });
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-S2 | Phone numbers encrypted | Masked in API response |
| NFR-SC4 | Dashboard responsive with 10k responses | Pagination (20/page) |

### Project Structure Notes

Files to create/modify:
- `packages/api/src/utils/phone-mask.ts` - NEW
- `packages/api/src/routers/delivery.ts` - NEW
- `packages/api/src/routers/index.ts` - ADD delivery router
- `apps/web/src/components/surveys/delivery-list.tsx` - NEW
- `apps/web/src/components/surveys/delivery-status-badge.tsx` - NEW
- `apps/web/src/components/surveys/delivery-detail.tsx` - NEW
- `apps/web/src/routes/_authenticated/surveys/$surveyId.tsx` - EXTEND with Deliveries tab
- `tests/integration/delivery-tracking.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR-S2]
- [Source: _bmad-output/project-context.md#Component patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
