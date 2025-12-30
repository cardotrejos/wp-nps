# Story 3.9: Onboarding Reminder Emails

Status: ready-for-dev

## Story

As a **System**,
I want to **send reminder emails to users who abandon onboarding for 24 hours**,
So that **we can recover users who got interrupted**.

## Acceptance Criteria

1. **Given** a user signed up but didn't complete onboarding **When** 24 hours pass without any activity **Then** a reminder email job is queued via webhook_jobs **And** the email is sent with a link to resume

2. **Given** a user already completed onboarding **When** the job processor runs **Then** no reminder email is sent

3. **Given** a reminder was already sent in the last 24 hours **When** the job runs again **Then** no duplicate email is sent

4. **Given** the user resumes onboarding after reminder **When** they complete the next step **Then** `lastActivityAt` is updated **And** the abandonment timer resets

5. **Given** the abandonment check cron runs **When** finding abandoned users **Then** it only selects users with `onboardingState.onboardingCompletedAt = null` **And** `lastActivityAt < NOW() - 24h`

## Tasks / Subtasks

- [ ] Task 1: Add Email Infrastructure (AC: #1)
  - [ ] 1.1 Install Resend SDK: `bun add resend`
  - [ ] 1.2 Add `RESEND_API_KEY` to environment variables
  - [ ] 1.3 Create `packages/api/src/lib/email.ts` with Resend client
  - [ ] 1.4 Create email interface `IEmailClient` for testability

- [ ] Task 2: Create Onboarding Email Log Table (AC: #3)
  - [ ] 2.1 Add `onboarding_email_log` table to `packages/db/src/schema/flowpulse.ts`
  - [ ] 2.2 Define columns: id, org_id, user_id, email_type, sent_at
  - [ ] 2.3 Add unique constraint on (org_id, email_type, DATE(sent_at)) for daily deduplication
  - [ ] 2.4 Run `bun db:push`

- [ ] Task 3: Create Abandonment Check Job (AC: #1, #2, #5)
  - [ ] 3.1 Create `apps/server/_source/jobs/handlers/onboarding-abandonment-check.ts`
  - [ ] 3.2 Implement query for users with incomplete onboarding + stale lastActivityAt
  - [ ] 3.3 Queue individual email jobs for each abandoned user
  - [ ] 3.4 Register handler in job registry

- [ ] Task 4: Create Email Send Job Handler (AC: #1, #3)
  - [ ] 4.1 Create `apps/server/_source/jobs/handlers/send-onboarding-reminder.ts`
  - [ ] 4.2 Check onboarding_email_log for recent reminder
  - [ ] 4.3 Skip if reminder already sent in last 24h
  - [ ] 4.4 Send email via Resend
  - [ ] 4.5 Log successful send to onboarding_email_log

- [ ] Task 5: Create Email Template (AC: #1)
  - [ ] 5.1 Create `packages/api/src/emails/onboarding-reminder.tsx` using React Email
  - [ ] 5.2 Include personalized greeting (user name)
  - [ ] 5.3 Include resume link with auth token
  - [ ] 5.4 Include progress indicator (which step they left off)

- [ ] Task 6: Create Abandonment Check Scheduler (AC: #5)
  - [ ] 6.1 Add cron-like scheduler to `apps/server/_source/jobs/scheduler.ts`
  - [ ] 6.2 Run abandonment check every hour
  - [ ] 6.3 Enqueue check job via webhook_jobs queue

- [ ] Task 7: Write Tests (AC: #1, #2, #3, #4, #5)
  - [ ] 7.1 Create `tests/integration/onboarding-reminder.test.ts`
  - [ ] 7.2 Test abandonment detection query
  - [ ] 7.3 Test duplicate prevention logic
  - [ ] 7.4 Test email job completion (mock Resend)
  - [ ] 7.5 Test completed onboarding exclusion

## Dev Notes

### Critical Architecture Compliance

**This story implements FR6 (send onboarding reminder emails after 24h abandonment), FR76 (track onboarding funnel events).**

From architecture.md:
- Use existing `webhook_jobs` queue from Story 3-1 (AR4)
- Multi-tenant isolation via `org_id` filtering (AR8, AR11)
- No third-party background job services for MVP

### Previous Story Context

Story 3-1 established:
- `webhook_jobs` table with queue semantics
- Job processor polling every 5s
- Event type routing to handlers

Story 1-4 established:
- `onboardingState` JSON column on `organization` table
- `lastActivityAt` timestamp updated on each step
- `onboardingCompletedAt` set when complete

### Onboarding State Reference

```typescript
// packages/db/src/schema/auth.ts (existing)
export const onboardingStateSchema = z.object({
  currentStep: z.number().default(1),
  completedSteps: z.array(z.number()).default([]),
  lastActivityAt: z.string().nullable().default(null),
  onboardingCompletedAt: z.string().nullable().default(null),
  metadata: z.object({
    whatsappConnected: z.boolean().default(false),
    selectedTemplateId: z.string().nullable().default(null),
    stepCompletedAt: z.record(z.string()).default({}),
  }).default({}),
});
```

### Email Log Schema

```typescript
// packages/db/src/schema/flowpulse.ts - ADD
export const onboardingEmailLog = pgTable('onboarding_email_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organization.id),
  userId: text('user_id').notNull().references(() => user.id),
  emailType: text('email_type').notNull(), // 'reminder_24h' | 'reminder_48h' | 'reminder_72h'
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_onboarding_email_log_org').on(table.orgId),
  // Prevent duplicate emails on same day
  uniqueIndex('uq_onboarding_email_org_type_date').on(
    table.orgId, 
    table.emailType, 
    sql`DATE(sent_at)`
  ),
]);
```

### Email Client Interface

```typescript
// packages/api/src/lib/email.ts
import { Resend } from 'resend';
import { env } from '@wp-nps/env/server';

export interface IEmailClient {
  send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ id: string }>;
}

class ResendEmailClient implements IEmailClient {
  private client: Resend;
  
  constructor() {
    this.client = new Resend(env.RESEND_API_KEY);
  }
  
  async send(params: { to: string; subject: string; html: string; from?: string }) {
    const result = await this.client.emails.send({
      from: params.from ?? 'FlowPulse <noreply@flowpulse.io>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    
    if (result.error) {
      throw new Error(`Email send failed: ${result.error.message}`);
    }
    
    return { id: result.data!.id };
  }
}

class MockEmailClient implements IEmailClient {
  public sentEmails: Array<{ to: string; subject: string; html: string }> = [];
  
  async send(params: { to: string; subject: string; html: string }) {
    this.sentEmails.push(params);
    return { id: `mock-${Date.now()}` };
  }
}

export const emailClient: IEmailClient = 
  env.NODE_ENV === 'test' 
    ? new MockEmailClient() 
    : new ResendEmailClient();

export { MockEmailClient };
```

### Abandonment Check Handler

```typescript
// apps/server/_source/jobs/handlers/onboarding-abandonment-check.ts
import type { JobHandler, WebhookJob } from '@wp-nps/db/types';
import { db } from '@wp-nps/db';
import { organization, user, member } from '@wp-nps/db/schema';
import { eq, and, lt, isNull, sql } from 'drizzle-orm';
import { enqueueJob } from '@wp-nps/api/services/job-queue';

const ABANDONMENT_THRESHOLD_HOURS = 24;

export const onboardingAbandonmentCheckHandler: JobHandler = {
  eventType: 'internal.onboarding.abandonment_check',
  
  async handle(job: WebhookJob) {
    const thresholdTime = new Date(Date.now() - ABANDONMENT_THRESHOLD_HOURS * 60 * 60 * 1000);
    
    // Find orgs with incomplete onboarding and stale lastActivityAt
    // This is a system-wide check, not per-org, so we query across all orgs
    const abandonedOrgs = await db
      .select({
        orgId: organization.id,
        userId: member.userId,
        currentStep: sql<number>`(${organization.onboardingState}->>'currentStep')::int`,
        lastActivityAt: sql<string>`${organization.onboardingState}->>'lastActivityAt'`,
      })
      .from(organization)
      .innerJoin(member, and(
        eq(member.organizationId, organization.id),
        eq(member.role, 'owner')
      ))
      .where(and(
        // Onboarding not completed
        sql`${organization.onboardingState}->>'onboardingCompletedAt' IS NULL`,
        // Last activity older than threshold
        sql`(${organization.onboardingState}->>'lastActivityAt')::timestamp < ${thresholdTime.toISOString()}`,
        // Has started onboarding (has lastActivityAt)
        sql`${organization.onboardingState}->>'lastActivityAt' IS NOT NULL`
      ))
      .limit(100); // Process in batches
    
    console.log(`Found ${abandonedOrgs.length} abandoned onboarding sessions`);
    
    // Queue individual reminder jobs for each abandoned user
    for (const org of abandonedOrgs) {
      await enqueueJob({
        orgId: org.orgId,
        idempotencyKey: `onboarding-reminder-${org.orgId}-${new Date().toISOString().split('T')[0]}`,
        source: 'internal',
        eventType: 'internal.email.onboarding_reminder',
        payload: {
          orgId: org.orgId,
          userId: org.userId,
          currentStep: org.currentStep,
          lastActivityAt: org.lastActivityAt,
        },
      });
    }
  },
};
```

### Email Reminder Handler

```typescript
// apps/server/_source/jobs/handlers/send-onboarding-reminder.ts
import type { JobHandler, WebhookJob } from '@wp-nps/db/types';
import { db } from '@wp-nps/db';
import { organization, user, onboardingEmailLog } from '@wp-nps/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { emailClient } from '@wp-nps/api/lib/email';
import { renderOnboardingReminderEmail } from '@wp-nps/api/emails/onboarding-reminder';

interface OnboardingReminderPayload {
  orgId: string;
  userId: string;
  currentStep: number;
  lastActivityAt: string;
}

export const sendOnboardingReminderHandler: JobHandler = {
  eventType: 'internal.email.onboarding_reminder',
  
  async handle(job: WebhookJob) {
    const payload = job.payload as OnboardingReminderPayload;
    
    // Check if reminder already sent today
    const today = new Date().toISOString().split('T')[0];
    const existingReminder = await db.query.onboardingEmailLog.findFirst({
      where: and(
        eq(onboardingEmailLog.orgId, payload.orgId),
        eq(onboardingEmailLog.emailType, 'reminder_24h'),
        sql`DATE(${onboardingEmailLog.sentAt}) = ${today}`
      ),
    });
    
    if (existingReminder) {
      console.log(`Skipping duplicate reminder for org ${payload.orgId}`);
      return;
    }
    
    // Check if onboarding was completed since job was queued
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, payload.orgId),
    });
    
    if (!org) {
      console.log(`Org ${payload.orgId} not found, skipping`);
      return;
    }
    
    const onboardingState = org.onboardingState as { onboardingCompletedAt: string | null };
    if (onboardingState?.onboardingCompletedAt) {
      console.log(`Org ${payload.orgId} completed onboarding, skipping`);
      return;
    }
    
    // Get user email
    const userData = await db.query.user.findFirst({
      where: eq(user.id, payload.userId),
    });
    
    if (!userData?.email) {
      console.log(`User ${payload.userId} has no email, skipping`);
      return;
    }
    
    // Render and send email
    const html = renderOnboardingReminderEmail({
      userName: userData.name ?? 'there',
      currentStep: payload.currentStep,
      resumeUrl: `${process.env.APP_URL}/onboarding?resume=true`,
    });
    
    await emailClient.send({
      to: userData.email,
      subject: "Let's finish setting up FlowPulse - it only takes 5 minutes!",
      html,
    });
    
    // Log the sent email
    await db.insert(onboardingEmailLog).values({
      orgId: payload.orgId,
      userId: payload.userId,
      emailType: 'reminder_24h',
    });
    
    console.log(`Sent onboarding reminder to ${userData.email}`);
  },
};
```

### Email Template

```typescript
// packages/api/src/emails/onboarding-reminder.tsx
import * as React from 'react';
import { render } from '@react-email/render';

interface OnboardingReminderProps {
  userName: string;
  currentStep: number;
  resumeUrl: string;
}

const STEP_NAMES: Record<number, string> = {
  1: 'Account Created',
  2: 'Connect WhatsApp',
  3: 'Verify Connection',
  4: 'Select Survey Template',
};

function OnboardingReminderEmail({ userName, currentStep, resumeUrl }: OnboardingReminderProps) {
  const nextStepName = STEP_NAMES[currentStep] ?? 'Complete Setup';
  const stepsCompleted = currentStep - 1;
  const totalSteps = 4;
  
  return (
    <html>
      <head>
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #25D366; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .progress { background: #e5e5e5; border-radius: 10px; height: 8px; margin: 20px 0; }
          .progress-bar { background: #25D366; height: 8px; border-radius: 10px; width: ${(stepsCompleted / totalSteps) * 100}%; }
          .footer { margin-top: 30px; font-size: 12px; color: #888; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Hey {userName}!</h1>
          
          <p>You're so close to getting your first customer feedback via WhatsApp!</p>
          
          <div className="progress">
            <div className="progress-bar" />
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {stepsCompleted} of {totalSteps} steps completed
          </p>
          
          <p>Your next step: <strong>{nextStepName}</strong></p>
          
          <p>It takes most users under 5 minutes to complete setup and start collecting NPS scores.</p>
          
          <p style={{ marginTop: '20px' }}>
            <a href={resumeUrl} className="button">Continue Setup</a>
          </p>
          
          <p style={{ marginTop: '20px' }}>
            Questions? Just reply to this email - we're here to help!
          </p>
          
          <div className="footer">
            <p>
              FlowPulse - WhatsApp NPS Made Simple<br />
              You're receiving this because you started setting up FlowPulse.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

export function renderOnboardingReminderEmail(props: OnboardingReminderProps): string {
  return render(<OnboardingReminderEmail {...props} />);
}
```

### Job Scheduler

```typescript
// apps/server/_source/jobs/scheduler.ts
import { enqueueJob } from '@wp-nps/api/services/job-queue';

const HOUR_MS = 60 * 60 * 1000;
const SYSTEM_ORG_ID = 'system'; // Special org for system-level jobs

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  if (schedulerInterval) {
    console.log('Scheduler already running');
    return;
  }
  
  // Run immediately on startup
  scheduleAbandonmentCheck();
  
  // Then run every hour
  schedulerInterval = setInterval(() => {
    scheduleAbandonmentCheck();
  }, HOUR_MS);
  
  console.log('Job scheduler started (hourly abandonment checks)');
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Job scheduler stopped');
  }
}

async function scheduleAbandonmentCheck() {
  try {
    await enqueueJob({
      orgId: SYSTEM_ORG_ID,
      idempotencyKey: `abandonment-check-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}`,
      source: 'internal',
      eventType: 'internal.onboarding.abandonment_check',
      payload: { scheduledAt: new Date().toISOString() },
    });
    console.log('Scheduled abandonment check');
  } catch (error) {
    // Idempotency key conflict = already scheduled, ignore
    if ((error as Error).message?.includes('duplicate key')) {
      return;
    }
    console.error('Failed to schedule abandonment check:', error);
  }
}
```

### Test Patterns

```typescript
// tests/integration/onboarding-reminder.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestOrg } from '../support/helpers/test-org';
import { db } from '@wp-nps/db';
import { organization, user, onboardingEmailLog } from '@wp-nps/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendOnboardingReminderHandler } from 'apps/server/_source/jobs/handlers/send-onboarding-reminder';
import { onboardingAbandonmentCheckHandler } from 'apps/server/_source/jobs/handlers/onboarding-abandonment-check';
import { MockEmailClient, emailClient } from '@wp-nps/api/lib/email';

describe('Onboarding Reminder Emails', () => {
  let testOrg: { id: string };
  let testUser: { id: string; email: string };
  
  beforeEach(async () => {
    const created = await createTestOrg();
    testOrg = { id: created.orgId };
    testUser = { id: created.userId, email: created.email };
    
    // Reset mock email client
    (emailClient as MockEmailClient).sentEmails = [];
  });
  
  describe('Abandonment Detection', () => {
    it('detects users with stale lastActivityAt', async () => {
      const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
      
      await db.update(organization)
        .set({
          onboardingState: sql`jsonb_set(
            ${organization.onboardingState},
            '{lastActivityAt}',
            to_jsonb(${staleTime.toISOString()}::text)
          )`,
        })
        .where(eq(organization.id, testOrg.id));
      
      // Run abandonment check
      await onboardingAbandonmentCheckHandler.handle({
        id: 'test-job',
        orgId: 'system',
        payload: {},
        eventType: 'internal.onboarding.abandonment_check',
      } as any);
      
      // Check that a reminder job was queued
      const reminderJob = await db.query.webhookJob.findFirst({
        where: eq(webhookJob.eventType, 'internal.email.onboarding_reminder'),
      });
      
      expect(reminderJob).toBeDefined();
      expect(reminderJob?.payload.orgId).toBe(testOrg.id);
    });
    
    it('excludes users who completed onboarding', async () => {
      await db.update(organization)
        .set({
          onboardingState: sql`jsonb_set(
            ${organization.onboardingState},
            '{onboardingCompletedAt}',
            to_jsonb(${new Date().toISOString()}::text)
          )`,
        })
        .where(eq(organization.id, testOrg.id));
      
      await onboardingAbandonmentCheckHandler.handle({
        id: 'test-job',
        orgId: 'system',
        payload: {},
        eventType: 'internal.onboarding.abandonment_check',
      } as any);
      
      const reminderJob = await db.query.webhookJob.findFirst({
        where: and(
          eq(webhookJob.eventType, 'internal.email.onboarding_reminder'),
          sql`${webhookJob.payload}->>'orgId' = ${testOrg.id}`
        ),
      });
      
      expect(reminderJob).toBeUndefined();
    });
  });
  
  describe('Email Sending', () => {
    it('sends reminder email to abandoned user', async () => {
      await sendOnboardingReminderHandler.handle({
        id: 'test-job',
        orgId: testOrg.id,
        payload: {
          orgId: testOrg.id,
          userId: testUser.id,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        eventType: 'internal.email.onboarding_reminder',
      } as any);
      
      expect((emailClient as MockEmailClient).sentEmails).toHaveLength(1);
      expect((emailClient as MockEmailClient).sentEmails[0].to).toBe(testUser.email);
      expect((emailClient as MockEmailClient).sentEmails[0].subject).toContain('FlowPulse');
    });
    
    it('prevents duplicate emails on same day', async () => {
      // Insert existing log entry
      await db.insert(onboardingEmailLog).values({
        orgId: testOrg.id,
        userId: testUser.id,
        emailType: 'reminder_24h',
      });
      
      await sendOnboardingReminderHandler.handle({
        id: 'test-job',
        orgId: testOrg.id,
        payload: {
          orgId: testOrg.id,
          userId: testUser.id,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        eventType: 'internal.email.onboarding_reminder',
      } as any);
      
      // Should not have sent any email
      expect((emailClient as MockEmailClient).sentEmails).toHaveLength(0);
    });
    
    it('skips if onboarding completed since job queued', async () => {
      // Mark onboarding as completed
      await db.update(organization)
        .set({
          onboardingState: sql`jsonb_set(
            ${organization.onboardingState},
            '{onboardingCompletedAt}',
            to_jsonb(${new Date().toISOString()}::text)
          )`,
        })
        .where(eq(organization.id, testOrg.id));
      
      await sendOnboardingReminderHandler.handle({
        id: 'test-job',
        orgId: testOrg.id,
        payload: {
          orgId: testOrg.id,
          userId: testUser.id,
          currentStep: 2,
          lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        eventType: 'internal.email.onboarding_reminder',
      } as any);
      
      expect((emailClient as MockEmailClient).sentEmails).toHaveLength(0);
    });
  });
});
```

### Environment Variables

Add to `.env` files:
```
# apps/server/.env
RESEND_API_KEY=re_xxxxx

# packages/env/src/server.ts - ADD
RESEND_API_KEY: z.string().optional(),
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| FR6 | Send onboarding reminder after 24h abandonment | Abandonment check + email job |
| FR76 | Track onboarding funnel events | `onboarding_email_log` table |
| AR4 | DB-backed job queue | Uses existing webhook_jobs |

### Dependencies to Install

```bash
bun add resend @react-email/render
```

### Project Structure Notes

Files to create/modify:
- `packages/db/src/schema/flowpulse.ts` - ADD onboarding_email_log table
- `packages/api/src/lib/email.ts` - NEW email client abstraction
- `packages/api/src/emails/onboarding-reminder.tsx` - NEW email template
- `apps/server/_source/jobs/handlers/onboarding-abandonment-check.ts` - NEW
- `apps/server/_source/jobs/handlers/send-onboarding-reminder.ts` - NEW
- `apps/server/_source/jobs/handlers/index.ts` - REGISTER new handlers
- `apps/server/_source/jobs/scheduler.ts` - NEW hourly scheduler
- `apps/server/_source/index.ts` - START scheduler
- `packages/env/src/server.ts` - ADD RESEND_API_KEY
- `tests/integration/onboarding-reminder.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 3: Queue Strategy]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.9]
- [Source: _bmad-output/implementation-artifacts/3-1-webhook-job-queue-infrastructure.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
