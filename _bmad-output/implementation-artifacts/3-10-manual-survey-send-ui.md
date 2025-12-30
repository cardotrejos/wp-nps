# Story 3.10: Manual Survey Send UI

Status: ready-for-dev

## Story

As a **Business Owner**,
I want to **manually enter a phone number and send a survey**,
So that **I can send surveys to individual customers without API integration**.

## Acceptance Criteria

1. **Given** my survey has trigger type "Manual Send" **When** I click "Send Survey" on the survey page **Then** I see a modal with a phone number input field **And** the field validates international phone format

2. **Given** I enter a valid phone number **When** I click "Send" **Then** the survey is queued for delivery **And** I see "Survey sent to +55...1234" confirmation **And** the delivery appears in the Deliveries tab

3. **Given** I enter an invalid phone number **When** I click "Send" **Then** I see "Invalid phone number format" error **And** the survey is not sent

4. **Given** the survey is not active **When** I try to open the send modal **Then** I see "Activate survey first" tooltip on disabled button **And** the modal cannot be opened

5. **Given** I have optional metadata fields configured **When** I open the send modal **Then** I can optionally enter order_id and customer_name **And** these are included with the delivery

## Tasks / Subtasks

- [ ] Task 1: Create Phone Input Component (AC: #1, #3)
  - [ ] 1.1 Create `apps/web/src/components/phone-input.tsx` with E.164 validation
  - [ ] 1.2 Add country code selector dropdown (default to Brazil +55)
  - [ ] 1.3 Implement real-time validation with error message
  - [ ] 1.4 Add formatting display (spaces for readability)

- [ ] Task 2: Create Send Survey Modal (AC: #1, #2, #5)
  - [ ] 2.1 Create `apps/web/src/components/send-survey-modal.tsx`
  - [ ] 2.2 Include PhoneInput component
  - [ ] 2.3 Add optional metadata fields (order_id, customer_name)
  - [ ] 2.4 Add Send and Cancel buttons
  - [ ] 2.5 Show loading state during send

- [ ] Task 3: Create Survey Send Mutation (AC: #2)
  - [ ] 3.1 Add `survey.sendManual` oRPC procedure
  - [ ] 3.2 Validate phone format server-side
  - [ ] 3.3 Queue delivery via webhook_jobs
  - [ ] 3.4 Return delivery ID for confirmation

- [ ] Task 4: Integrate Modal in Survey Detail Page (AC: #1, #4)
  - [ ] 4.1 Add "Send Survey" button to survey detail page
  - [ ] 4.2 Conditionally enable based on survey.status === 'active'
  - [ ] 4.3 Show tooltip on disabled button explaining why
  - [ ] 4.4 Open modal on button click

- [ ] Task 5: Add Success/Error Toast Notifications (AC: #2, #3)
  - [ ] 5.1 Show success toast with masked phone number
  - [ ] 5.2 Show error toast for validation failures
  - [ ] 5.3 Navigate to Deliveries tab on success (optional)

- [ ] Task 6: Write Tests (AC: #1, #2, #3, #4, #5)
  - [ ] 6.1 Create `tests/integration/manual-send.test.ts` for oRPC procedure
  - [ ] 6.2 Create `tests/e2e/manual-survey-send.spec.ts` for UI flow
  - [ ] 6.3 Test E.164 validation
  - [ ] 6.4 Test disabled button for inactive survey
  - [ ] 6.5 Test metadata inclusion

## Dev Notes

### Critical Architecture Compliance

**This story implements FR13 (set trigger type), FR14 (trigger survey send via API/manual).**

From architecture.md:
- Uses existing `webhook_jobs` queue from Story 3-1 (AR4)
- oRPC procedure returns data directly (AR12)
- E.164 phone format validation

### Previous Story Context

Story 2-7 established:
- `survey.trigger_type` column (api, manual)
- Trigger type UI on survey settings page

Story 3-3 established:
- Survey send queueing logic
- `survey_delivery` table creation
- Phone validation regex

### Phone Input Component

```typescript
// apps/web/src/components/phone-input.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const COUNTRY_CODES = [
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
];

export function PhoneInput({ value, onChange, error, disabled }: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState('+55');
  const [localNumber, setLocalNumber] = React.useState('');
  
  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const code = COUNTRY_CODES.find(c => value.startsWith(c.code));
      if (code) {
        setCountryCode(code.code);
        setLocalNumber(value.slice(code.code.length));
      }
    }
  }, []);
  
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    setLocalNumber(cleaned);
    onChange(`${countryCode}${cleaned}`);
  };
  
  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    onChange(`${code}${localNumber}`);
  };
  
  const formatDisplay = (num: string) => {
    // Format for display: 11 9999-9999 (Brazil mobile)
    if (num.length <= 2) return num;
    if (num.length <= 7) return `${num.slice(0, 2)} ${num.slice(2)}`;
    return `${num.slice(0, 2)} ${num.slice(2, 7)}-${num.slice(7, 11)}`;
  };
  
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map(country => (
              <SelectItem key={country.code} value={country.code}>
                {country.flag} {country.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          type="tel"
          value={formatDisplay(localNumber)}
          onChange={handleLocalChange}
          placeholder="11 99999-9999"
          className={cn("flex-1", error && "border-red-500")}
          disabled={disabled}
          maxLength={14}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
```

### E.164 Validation

```typescript
// packages/api/src/lib/phone-validation.ts
export const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  if (!phone.startsWith('+')) {
    return { valid: false, error: 'Phone must start with country code (e.g., +55)' };
  }
  
  if (!E164_REGEX.test(phone)) {
    return { valid: false, error: 'Invalid phone format. Use E.164 format (e.g., +5511999999999)' };
  }
  
  // Brazil-specific validation (most common)
  if (phone.startsWith('+55')) {
    const localNumber = phone.slice(3);
    if (localNumber.length !== 11) {
      return { valid: false, error: 'Brazilian numbers must have 11 digits (DDD + 9 digits)' };
    }
  }
  
  return { valid: true };
}

export function maskPhone(phone: string): string {
  // Show only last 4 digits: +55119****1234
  if (phone.length < 5) return phone;
  const visible = phone.slice(-4);
  const masked = phone.slice(0, -4).replace(/\d/g, '*');
  return `${masked}${visible}`;
}
```

### Send Survey Modal

```typescript
// apps/web/src/components/send-survey-modal.tsx
import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from './phone-input';
import { useToast } from '@/hooks/use-toast';
import { orpc } from '@/utils/orpc';
import { isValidE164, maskPhone } from '@wp-nps/api/lib/phone-validation';

interface SendSurveyModalProps {
  surveyId: string;
  surveyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  phone: z.string().refine(isValidE164, 'Invalid phone format'),
  metadata: z.object({
    orderId: z.string().optional(),
    customerName: z.string().optional(),
  }).optional(),
});

export function SendSurveyModal({ surveyId, surveyName, open, onOpenChange }: SendSurveyModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const sendMutation = orpc.survey.sendManual.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Survey sent!',
        description: `Sent to ${maskPhone(data.phone)}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to send',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const form = useForm({
    defaultValues: {
      phone: '',
      orderId: '',
      customerName: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await sendMutation.mutateAsync({
          surveyId,
          phone: value.phone,
          metadata: {
            order_id: value.orderId || undefined,
            customer_name: value.customerName || undefined,
          },
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });
  
  const [phoneError, setPhoneError] = React.useState<string>();
  
  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!isValidE164(phone)) {
      setPhoneError('Invalid phone format. Use E.164 (e.g., +5511999999999)');
      return false;
    }
    setPhoneError(undefined);
    return true;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send "{surveyName}"</DialogTitle>
        </DialogHeader>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const phoneValue = form.getFieldValue('phone');
            if (validatePhone(phoneValue)) {
              form.handleSubmit();
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <form.Field name="phone">
              {(field) => (
                <PhoneInput
                  value={field.state.value}
                  onChange={(v) => {
                    field.handleChange(v);
                    if (phoneError) validatePhone(v);
                  }}
                  error={phoneError}
                  disabled={isSubmitting}
                />
              )}
            </form.Field>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name (optional)</Label>
            <form.Field name="customerName">
              {(field) => (
                <Input
                  id="customerName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Carlos Silva"
                  disabled={isSubmitting}
                />
              )}
            </form.Field>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID (optional)</Label>
            <form.Field name="orderId">
              {(field) => (
                <Input
                  id="orderId"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="ORD-12345"
                  disabled={isSubmitting}
                />
              )}
            </form.Field>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Survey'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### oRPC Procedure

```typescript
// packages/api/src/routers/survey.ts - ADD
import { z } from 'zod';
import { protectedProcedure } from '../index';
import { ORPCError } from '@orpc/server';
import { db } from '@wp-nps/db';
import { survey, surveyDelivery } from '@wp-nps/db/schema';
import { eq, and } from 'drizzle-orm';
import { enqueueJob } from '../services/job-queue';
import { validatePhone, maskPhone } from '../lib/phone-validation';
import { createHash } from 'crypto';

export const sendManualProcedure = protectedProcedure
  .input(z.object({
    surveyId: z.string(),
    phone: z.string(),
    metadata: z.object({
      order_id: z.string().optional(),
      customer_name: z.string().optional(),
    }).optional(),
  }))
  .handler(async ({ input, context }) => {
    const { surveyId, phone, metadata } = input;
    const orgId = context.orgId!;
    
    // Validate phone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      throw new ORPCError('BAD_REQUEST', { message: phoneValidation.error });
    }
    
    // Check survey exists and is active
    const surveyRecord = await db.query.survey.findFirst({
      where: and(
        eq(survey.id, surveyId),
        eq(survey.orgId, orgId)
      ),
    });
    
    if (!surveyRecord) {
      throw new ORPCError('NOT_FOUND', { message: 'Survey not found' });
    }
    
    if (surveyRecord.status !== 'active') {
      throw new ORPCError('BAD_REQUEST', { message: 'Survey must be active to send' });
    }
    
    // Create delivery record
    const phoneHash = createHash('sha256').update(phone).digest('hex');
    
    const [delivery] = await db.insert(surveyDelivery)
      .values({
        orgId,
        surveyId,
        phoneNumber: phone, // Encrypted at rest by DB
        phoneNumberHash: phoneHash,
        status: 'pending',
        metadata: metadata ?? {},
      })
      .returning({ id: surveyDelivery.id });
    
    // Queue for delivery
    await enqueueJob({
      orgId,
      idempotencyKey: `manual-send-${delivery.id}`,
      source: 'internal',
      eventType: 'internal.survey.send',
      payload: {
        deliveryId: delivery.id,
        surveyId,
        phone,
        metadata,
      },
    });
    
    return {
      deliveryId: delivery.id,
      phone: maskPhone(phone),
      status: 'queued',
    };
  });

// Add to survey router
export const surveyRouter = {
  // ... existing procedures
  sendManual: sendManualProcedure,
};
```

### Survey Detail Page Integration

```typescript
// apps/web/src/routes/_authenticated/surveys/$surveyId.tsx - ADD to existing component
import { SendSurveyModal } from '@/components/send-survey-modal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Send } from 'lucide-react';

// Inside the SurveyDetail component:
function SurveyDetailActions({ survey }: { survey: Survey }) {
  const [sendModalOpen, setSendModalOpen] = React.useState(false);
  
  const canSend = survey.status === 'active';
  
  return (
    <div className="flex gap-2">
      {survey.triggerType === 'manual' && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={() => setSendModalOpen(true)}
                  disabled={!canSend}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Survey
                </Button>
              </span>
            </TooltipTrigger>
            {!canSend && (
              <TooltipContent>
                <p>Activate the survey first to send it</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <SendSurveyModal
            surveyId={survey.id}
            surveyName={survey.name}
            open={sendModalOpen}
            onOpenChange={setSendModalOpen}
          />
        </>
      )}
    </div>
  );
}
```

### Test Patterns

```typescript
// tests/integration/manual-send.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { db } from '@wp-nps/db';
import { survey, surveyDelivery, webhookJob } from '@wp-nps/db/schema';
import { eq } from 'drizzle-orm';
import { appRouter } from '@wp-nps/api/routers/index';
import { createContext } from '@wp-nps/api/context';

describe('Manual Survey Send', () => {
  let testOrg: { id: string };
  let testSurvey: { id: string };
  
  beforeEach(async () => {
    testOrg = await createTestOrg();
    
    const [s] = await db.insert(survey).values({
      orgId: testOrg.id,
      name: 'Test Survey',
      type: 'nps',
      status: 'active',
      triggerType: 'manual',
    }).returning();
    testSurvey = s;
  });
  
  it('creates delivery and queues job for valid phone', async () => {
    const context = await createContext({
      context: { request: new Request('http://test') },
      user: { id: 'user-1' },
      orgId: testOrg.id,
    });
    
    const result = await appRouter.survey.sendManual.handler({
      input: {
        surveyId: testSurvey.id,
        phone: '+5511999999999',
        metadata: { order_id: 'ORD-123' },
      },
      context,
    });
    
    expect(result.status).toBe('queued');
    expect(result.deliveryId).toBeDefined();
    expect(result.phone).toContain('****'); // Masked
    
    // Check delivery created
    const delivery = await db.query.surveyDelivery.findFirst({
      where: eq(surveyDelivery.id, result.deliveryId),
    });
    expect(delivery?.status).toBe('pending');
    expect(delivery?.metadata).toEqual({ order_id: 'ORD-123' });
    
    // Check job queued
    const job = await db.query.webhookJob.findFirst({
      where: eq(webhookJob.payload, sql`${webhookJob.payload}->>'deliveryId' = ${result.deliveryId}`),
    });
    expect(job).toBeDefined();
  });
  
  it('rejects invalid phone format', async () => {
    const context = await createContext({
      context: { request: new Request('http://test') },
      user: { id: 'user-1' },
      orgId: testOrg.id,
    });
    
    await expect(
      appRouter.survey.sendManual.handler({
        input: {
          surveyId: testSurvey.id,
          phone: '11999999999', // Missing +
        },
        context,
      })
    ).rejects.toThrow(/phone/i);
  });
  
  it('rejects inactive survey', async () => {
    // Deactivate survey
    await db.update(survey)
      .set({ status: 'inactive' })
      .where(eq(survey.id, testSurvey.id));
    
    const context = await createContext({
      context: { request: new Request('http://test') },
      user: { id: 'user-1' },
      orgId: testOrg.id,
    });
    
    await expect(
      appRouter.survey.sendManual.handler({
        input: {
          surveyId: testSurvey.id,
          phone: '+5511999999999',
        },
        context,
      })
    ).rejects.toThrow(/active/i);
  });
});
```

```typescript
// tests/e2e/manual-survey-send.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../support/helpers/auth';

test.describe('Manual Survey Send UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    // Navigate to a manual trigger survey
  });
  
  test('opens send modal and validates phone', async ({ page }) => {
    await page.click('[data-testid="send-survey-button"]');
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Send')).toBeVisible();
    
    // Try invalid phone
    await page.fill('[data-testid="phone-input"]', '123');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/invalid phone/i)).toBeVisible();
  });
  
  test('sends survey with valid phone', async ({ page }) => {
    await page.click('[data-testid="send-survey-button"]');
    
    // Enter valid phone
    await page.fill('[data-testid="phone-input"]', '11999999999');
    await page.fill('[data-testid="customer-name-input"]', 'Test Customer');
    await page.fill('[data-testid="order-id-input"]', 'ORD-456');
    
    await page.click('button[type="submit"]');
    
    // Should show success
    await expect(page.getByText(/survey sent/i)).toBeVisible();
  });
  
  test('disabled button for inactive survey', async ({ page }) => {
    // Navigate to inactive survey
    await page.goto('/surveys/inactive-survey-id');
    
    const sendButton = page.getByTestId('send-survey-button');
    await expect(sendButton).toBeDisabled();
    
    // Hover should show tooltip
    await sendButton.hover();
    await expect(page.getByText(/activate/i)).toBeVisible();
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| FR13 | Set trigger type for survey | Uses `triggerType` from Story 2-7 |
| FR14 | Trigger survey send via manual | Modal + phone input + queue |
| NFR-I5 | Meaningful error codes | Validation errors with clear messages |

### UI/UX Notes (Delegate to frontend-ui-ux-engineer)

The visual styling of these components should be delegated:
- PhoneInput country selector styling
- Modal layout and spacing
- Toast notification styling
- Button states and hover effects
- Loading spinner animation

### Project Structure Notes

Files to create/modify:
- `apps/web/src/components/phone-input.tsx` - NEW
- `apps/web/src/components/send-survey-modal.tsx` - NEW
- `packages/api/src/lib/phone-validation.ts` - NEW
- `packages/api/src/routers/survey.ts` - ADD sendManual procedure
- `apps/web/src/routes/_authenticated/surveys/$surveyId.tsx` - ADD send button
- `tests/integration/manual-send.test.ts` - NEW
- `tests/e2e/manual-survey-send.spec.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#oRPC Integration]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.10]
- [Source: _bmad-output/implementation-artifacts/3-3-survey-send-api-endpoint.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
