# Story 1.0: Foundation - Schema, RLS & Test Infrastructure

Status: ready-for-dev

## Story

As a **Developer**,
I want to **have the base database schema, multi-tenancy enforcement, and test infrastructure in place**,
So that **all subsequent stories have a secure, testable foundation**.

## Acceptance Criteria

1. **Given** the project is freshly cloned **When** I run `bun db:push` **Then** all base tables are created (user, organization, member, session via Better Auth) **And** RLS policies are enabled on all tenant-scoped tables **And** the `org_id` context injection pattern is implemented

2. **Given** I run `bun test` **When** the test suite executes **Then** Vitest runs with proper configuration **And** MSW is configured for Kapso mocking (AR3) **And** test database uses transaction rollback isolation (AR16)

3. **Given** any database query runs **When** the query targets tenant-scoped data **Then** `org_id` filter is automatically enforced (AR11)

## Tasks / Subtasks

- [ ] Task 1: Configure Better Auth Organization Plugin (AC: #1)
  - [ ] 1.1 Install Better Auth organization plugin dependencies
  - [ ] 1.2 Configure organization plugin in `packages/auth/src/index.ts`
  - [ ] 1.3 Define roles: owner, admin, member with appropriate permissions
  - [ ] 1.4 Configure client-side organization plugin in web app
  - [ ] 1.5 Run `bun db:push` to create organization, member, invitation tables

- [ ] Task 2: Create FlowPulse Base Schema (AC: #1, #3)
  - [ ] 2.1 Create `packages/db/src/schema/flowpulse.ts` with base tables
  - [ ] 2.2 Define `whatsapp_connection` table with `org_id` FK
  - [ ] 2.3 Define `webhook_jobs` table for job queue (AR3)
  - [ ] 2.4 Define `org_metrics` table for pre-aggregated metrics (AR5)
  - [ ] 2.5 Define `org_usage` table for usage metering (AR6)
  - [ ] 2.6 Export all schemas from `packages/db/src/schema/index.ts`

- [ ] Task 3: Implement RLS + Application-Level Multi-Tenancy (AC: #1, #3)
  - [ ] 3.1 Enable RLS on all FlowPulse tables using `pgTable.withRLS()`
  - [ ] 3.2 Create RLS policies for `org_id = current_setting('app.current_org_id')`
  - [ ] 3.3 Implement org context middleware in `packages/api/src/middleware/org-context.ts`
  - [ ] 3.4 Set PostgreSQL session variable from session's `activeOrganizationId`
  - [ ] 3.5 Ensure all queries include explicit `WHERE org_id = ?` (defense in depth)

- [ ] Task 4: Set Up Vitest Test Infrastructure (AC: #2)
  - [ ] 4.1 Install Vitest and related dependencies (`vitest`, `@vitest/coverage-v8`)
  - [ ] 4.2 Create `vitest.config.ts` with proper configuration
  - [ ] 4.3 Configure test database connection with transaction rollback
  - [ ] 4.4 Create test utilities for org context setup
  - [ ] 4.5 Add `bun test` script to root package.json

- [ ] Task 5: Configure MSW for Kapso Mocking (AC: #2)
  - [ ] 5.1 Install MSW (`msw`)
  - [ ] 5.2 Create `packages/kapso/src/mock.ts` with `KapsoMockClient` class
  - [ ] 5.3 Implement mock handlers for Kapso API endpoints
  - [ ] 5.4 Configure MSW setup in Vitest `setupFiles`
  - [ ] 5.5 Create test helpers for configuring mock responses

- [ ] Task 6: Create Docker Compose Test Environment (AC: #2)
  - [ ] 6.1 Create `docker/docker-compose.test.yml` with PostgreSQL test container
  - [ ] 6.2 Configure test database with RLS enabled
  - [ ] 6.3 Add test DB startup script to CI workflow

- [ ] Task 7: Write Foundation Tests (AC: #1, #2, #3)
  - [ ] 7.1 Write tests for Better Auth organization creation
  - [ ] 7.2 Write cross-tenant isolation tests (MUST fail on cross-org access)
  - [ ] 7.3 Write RLS policy enforcement tests
  - [ ] 7.4 Write Kapso mock client tests
  - [ ] 7.5 Verify 80% code coverage threshold

## Dev Notes

### Critical Architecture Compliance

**Multi-Tenancy Strategy (AR8, AR11):**
- Hybrid approach: RLS policies + application-level filtering
- RLS provides defense against SQL injection and query bugs
- Application filtering provides performance optimization
- EVERY FlowPulse query MUST include `orgId` filter - NON-NEGOTIABLE

**Better Auth Organization Plugin (AR1):**
```typescript
// packages/auth/src/index.ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      roles: {
        owner: ["create", "read", "update", "delete", "invite", "remove"],
        admin: ["read", "update", "invite"],
        member: ["read"],
      },
    }),
  ],
});
```

**RLS Implementation Pattern (Drizzle v1.0.0+):**
```typescript
// Use pgTable.withRLS() NOT .enableRLS()
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const survey = pgTable.withRLS('survey', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organization.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Org Context Middleware Pattern:**
```typescript
// packages/api/src/middleware/org-context.ts
export const orgContextMiddleware = async (ctx: Context, next: Next) => {
  const orgId = ctx.session?.activeOrganizationId;
  if (!orgId) throw new UnauthorizedError('No organization context');

  // Set PostgreSQL session variable for RLS
  await ctx.db.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`);

  ctx.orgId = orgId;
  await next();
};
```

### Project Structure Notes

**Files to Create:**
- `packages/auth/src/index.ts` - EXTEND with organization plugin
- `packages/db/src/schema/flowpulse.ts` - NEW FlowPulse schema
- `packages/db/src/schema/index.ts` - EXTEND to export flowpulse
- `packages/api/src/middleware/org-context.ts` - NEW org context middleware
- `packages/kapso/` - NEW package (scaffold only for this story)
- `packages/kapso/src/mock.ts` - NEW Kapso mock client
- `vitest.config.ts` - NEW at project root
- `docker/docker-compose.test.yml` - NEW test environment

**Naming Conventions:**
- Tables: Singular, lowercase (`survey`, `response`, `alert`)
- Columns: snake_case in SQL (`org_id`, `created_at`)
- TypeScript fields: camelCase (`orgId`, `createdAt`)
- Foreign keys: `{referenced_table}_id` (`survey_id`, `org_id`)
- Indexes: `idx_{table}_{columns}` (`idx_survey_org_id`)

### Testing Standards

**Vitest Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

**MSW Kapso Mock Pattern:**
```typescript
// packages/kapso/src/mock.ts
export class KapsoMockClient implements IKapsoClient {
  private responses: Map<string, MockResponse> = new Map();

  async sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult> {
    // Return configurable mock responses for testing
  }

  mockSuccess(deliveryId: string): void { /* ... */ }
  mockFailure(deliveryId: string, error: KapsoError): void { /* ... */ }
  getCallHistory(): SurveyCall[] { /* ... */ }
}
```

**Cross-Tenant Isolation Test (MUST FAIL):**
```typescript
// Tests that MUST fail to verify isolation
test('cross-tenant access should fail', async () => {
  const org1 = await createTestOrg('Acme Corp');
  const org2 = await createTestOrg('Beta Inc');
  const org2Survey = await createSurvey(org2.id, { name: 'Test' });

  // Attempting to access org2's survey with org1 context
  await expect(
    getWithOrg(org1.id).survey.get({ id: org2Survey.id })
  ).rejects.toThrow();
});
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-1] Better Auth Organization Extension
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-3] Webhook Handling Pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Multi-Tenancy-Enforcement-Strategy] Hybrid RLS approach
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing-Requirements] Kapso testing strategy
- [Source: _bmad-output/project-context.md#Testing-Stack] Vitest + MSW + Playwright
- [Source: Better Auth Docs] Organization plugin with roles configuration
- [Source: Drizzle ORM Docs] RLS with `pgTable.withRLS()` (v1.0.0+)

### Latest Technical Specifics

**Better Auth Organization Plugin (v1.4.9):**
- Use `organization()` from `better-auth/plugins`
- Creates `organization`, `member`, `invitation` tables automatically
- Provides session context with `activeOrganizationId`
- Role-based access control built-in

**Drizzle RLS (v0.45.1 → targeting v1.0.0 patterns):**
- Use `pgTable.withRLS()` for enabling RLS (NOT deprecated `.enableRLS()`)
- Define policies with `pgPolicy()` function
- Set session context with `set_config('app.current_org_id', $1, true)`

**Vitest (Latest):**
- Native Vite integration - fast startup
- Use `@vitest/coverage-v8` for coverage
- Configure in `vitest.config.ts` NOT `vite.config.ts`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log
| Change | File(s) | Reason |
|--------|---------|--------|

### File List
