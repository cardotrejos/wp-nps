---
project_name: 'FlowPulse'
user_name: 'Cardotrejos'
date: '2025-12-26'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow', 'critical_rules']
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Runtime & Build

- **Bun 1.3.5** - Package manager AND runtime (NOT npm/yarn)
  - Use `bun add` NOT `npm install` or `yarn add`
  - Use `bun run` NOT `npm run`
- **Vite 6.2.2** - Build tool with @tailwindcss/vite plugin
- **Turbo 2.6.3** - Monorepo task orchestration

### Frontend Stack

- **React 19.2.3** - Latest React (has `use()` hook but we use TanStack Query)
- **TailwindCSS 4.0.15** - v4 architecture (BREAKING CHANGE from v3)
  - Uses `@tailwindcss/vite` plugin, NOT PostCSS config
  - Different plugin/config patterns than v3 tutorials
- **TanStack Router 1.141.1** - File-based routing (`$param.tsx` for dynamic)
- **TanStack Query 5.90.12** - Server state management
- **TanStack Form 1.12.3** - Form state management
- **shadcn/ui** - Component library (via @base-ui/react)

### Backend Stack

- **Elysia 1.3.21** - Bun-native HTTP server
- **oRPC 1.12.2** - Type-safe RPC ⚠️ NOT tRPC - different API patterns
  - Handlers return data directly, NOT `{ data, error }` wrappers
  - No `.query()` / `.mutation()` chainable API
- **Better Auth 1.4.9** - Authentication with organization plugin
- **Drizzle ORM 0.45.1** - PostgreSQL ORM
  - Uses `eq()`, `and()`, `or()` helpers - NOT Prisma syntax
- **PostgreSQL 14+** - Primary database

### Monorepo Patterns

- `workspace:*` - Links to workspace packages (not a version)
- `catalog:` - Pulls version from root package.json catalog
  - Ensures version consistency across all packages

### Testing Stack (To Be Installed)

- **Vitest** - Unit/integration tests (Vite-native)
- **MSW** - API mocking for Kapso contract tests
- **Playwright** - E2E testing

### Critical Version Notes

- TailwindCSS v4 uses different plugin architecture than v3
- oRPC is NOT tRPC - completely different API patterns
- Drizzle is NOT Prisma - different query syntax
- React 19 features available but TanStack Query preferred for data fetching

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

#### Strict Mode Requirements

- **strict: true** - All strict checks enabled
- **noUncheckedIndexedAccess: true** - Array/object access returns `T | undefined`

  ```typescript
  // ❌ WRONG - Will error
  const first = items[0].toUpperCase();

  // ✅ CORRECT - Guard the access
  const first = items[0];
  if (first) { console.log(first.toUpperCase()); }

  // ✅ CORRECT - When you KNOW it exists
  const first = items[0]!;
  ```

- **noUnusedLocals/Parameters** - Remove or prefix with `_`

#### Import/Export Patterns (verbatimModuleSyntax)

- Use `import type { Foo }` for type-only imports
- Use `import { type Foo, bar }` for mixed imports
- Re-exports must be explicit:

  ```typescript
  // ❌ WRONG
  export { SurveyType } from './types';

  // ✅ CORRECT
  export type { SurveyType } from './types';
  ```

#### Bun Runtime Types

- `types: ['bun']` - Bun globals available (`Bun.serve`, `Bun.file`)
- Node.js types NOT available - use Bun equivalents
- Web app has DOM types, server does NOT

#### Zod + oRPC Type Chain

```typescript
// Schema definition
const surveySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['nps', 'csat', 'ces']),
});

// Type inference
type Survey = z.infer<typeof surveySchema>;

// oRPC integration - input is fully typed
surveyRouter.create = protectedProcedure
  .input(surveySchema)
  .handler(({ input }) => { /* typed */ });
```

#### Array Mapping with Optional Items

```typescript
// Project convention for potentially undefined array items
{errors.map((error) => (
  <p key={error?.message}>{error?.message}</p>
))}
```

#### Test Assertions with Strict Mode

```typescript
// ❌ WRONG - noUncheckedIndexedAccess error
expect(result[0].name).toBe('test');

// ✅ CORRECT - assert existence first
expect(result[0]).toBeDefined();
expect(result[0]!.name).toBe('test');
```

#### Nullish Patterns

- Use `??` for nullish coalescing (not `||`)
- Use `?.` for optional chaining
- Explicit null checks required for indexed access

---

### Framework-Specific Rules

#### Path Aliases

```typescript
// @/ resolves to apps/web/src/ (configured in vite.config.ts)
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

// ❌ WRONG - No deep relative paths
import { Button } from '../../../components/ui/button';
```

#### Loading States

```typescript
import Loader from '@/components/loader';
if (isPending) { return <Loader />; }
```

#### TanStack Router

```typescript
const navigate = useNavigate({ from: '/' });
navigate({ to: '/dashboard' });
navigate({ to: '/surveys/$surveyId', params: { surveyId } });
```

- `$paramName.tsx` for dynamic routes
- `_authenticated/` prefix for protected routes

#### TanStack Form (Project Convention)

```typescript
// Form submit - ALWAYS this pattern
<form onSubmit={(e) => {
  e.preventDefault();
  e.stopPropagation();
  form.handleSubmit();
}}>

// Field pattern
<form.Field name="email">
  {(field) => (
    <Input
      id={field.name}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>

// Submit button - ALWAYS use Subscribe
<form.Subscribe>
  {(state) => (
    <Button disabled={!state.canSubmit || state.isSubmitting}>
      {state.isSubmitting ? 'Submitting...' : 'Submit'}
    </Button>
  )}
</form.Subscribe>
```

#### TanStack Query

- Query key factory from `packages/shared/src/query-keys.ts`
- Loading: `isPending`, Background: `isFetching`
- **Polling for MVP**: `refetchInterval: 30_000` (no WebSockets)

#### oRPC (NOT tRPC!)

- `@orpc/tanstack-query` for React integration
- **Procedures**: `publicProcedure` (health), `protectedProcedure` (all business logic)

```typescript
// ✅ CORRECT
await client.survey.list({ orgId });

// ❌ WRONG - tRPC patterns don't exist
client.survey.list.query({ orgId });
```

#### ⚠️ CRITICAL: Multi-Tenancy Enforcement

```typescript
// EVERY query MUST include org filter - NON-NEGOTIABLE
where: eq(survey.orgId, context.session.activeOrganizationId)
```

#### Drizzle ORM (NOT Prisma!)

- Helpers: `eq()`, `and()`, `or()`, `desc()`, `asc()`

#### shadcn/ui + Sonner

```typescript
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
toast.success('Created'); toast.error(error.message);
```

#### Kapso Testing

```typescript
// NEVER real API calls in tests
const client = new KapsoMockClient();
```

---

### Testing Rules

#### Testing Stack

- **Vitest** - Unit/integration tests (Vite-native, NOT Jest)
- **MSW** - API mocking for Kapso contract tests
- **Playwright** - E2E testing

#### Test File Organization

```
# Co-located unit tests (preferred)
packages/api/src/routers/survey.ts
packages/api/src/routers/survey.test.ts

# Integration tests
tests/integration/survey-flow.test.ts

# E2E tests
tests/e2e/dashboard.spec.ts
```

#### Kapso Mocking (CRITICAL)

```typescript
// NEVER make real Kapso API calls in tests
import { KapsoMockClient } from '@wp-nps/kapso';

const client = new KapsoMockClient();
client.mockSuccess('delivery-123');
client.mockFailure('delivery-456', new KapsoError('rate_limited'));
```

#### Multi-Tenant Test Isolation

```typescript
// Seed multiple orgs - test cross-tenant access FAILS
const org1 = await createTestOrg('Acme Corp');
const org2 = await createTestOrg('Beta Inc');

await expect(
  getWithOrg(org1.id).survey.get({ id: org2SurveyId })
).rejects.toThrow();
```

#### Database Test Strategy

- Transaction rollback for test isolation
- Docker Compose for CI test database

#### Coverage

- 80% threshold
- Mock external dependencies (Kapso)

---

### Code Quality & Style Rules

#### Linting & Formatting

- **oxlint + oxfmt** - Rust-based linter (fast)
- Run: `bun check` for lint + format

#### Database Naming

| Element      | Pattern              | Example                |
| ------------ | -------------------- | ---------------------- |
| Tables       | Singular, lowercase  | `survey`, `response`   |
| Columns      | snake_case (SQL)     | `org_id`, `created_at` |
| TypeScript   | camelCase            | `orgId`, `createdAt`   |
| Foreign keys | `{table}_id`         | `survey_id`            |
| Indexes      | `idx_{table}_{cols}` | `idx_survey_org_id`    |

#### File Naming

| Element    | Pattern           | Example           |
| ---------- | ----------------- | ----------------- |
| Components | kebab-case        | `survey-card.tsx` |
| Hooks      | kebab-case + use- | `use-surveys.ts`  |
| Tests      | co-located        | `survey.test.ts`  |

#### Export Naming

- Components: PascalCase (`SurveyCard`)
- Hooks: camelCase + use (`useSurveys`)
- Types: PascalCase (`Survey`)

#### API Naming

- Routers: camelCase noun (`surveyRouter`)
- Procedures: verb + noun (`create`, `getById`, `list`)
- Query keys: array namespace (`['surveys', orgId]`)

#### Component Organization

```
components/
├── ui/           # shadcn primitives
├── dashboard/    # Dashboard-specific
├── surveys/      # Survey management
└── shared/       # Cross-feature
```

#### Documentation

- Avoid excessive comments - self-explanatory code
- NO auto-generated docstrings unless requested
- Comments only for non-obvious business logic

---

### Development Workflow Rules

#### Monorepo Commands

```bash
# Development
bun dev              # All services via Turbo
bun dev:web          # Frontend only (port 3001)
bun dev:server       # Backend only

# Database
bun db:push          # Apply schema changes
bun db:studio        # Drizzle Studio GUI
bun db:generate      # Generate migrations

# Quality
bun check            # Lint + format (oxlint/oxfmt)
bun check-types      # TypeScript type checking
bun build            # Build all packages
```

#### Package Dependencies

- Add shared deps to root: `bun add -d <pkg>`
- Add to specific package: `bun add -F <package-name> <pkg>`
- Use `workspace:*` for internal packages
- Use `catalog:` for shared version management

#### Build Order (Turbo handles)

```
packages/config → packages/env → packages/db → packages/auth → packages/api → apps/*
```

#### Environment Variables

- Server env: `apps/server/.env`
- Never commit `.env` files
- Use `.env.example` as template

#### Deployment

- Railway.app (São Paulo region)
- Auto-deploy on merge to `main`

---

### ⚠️ Critical Don't-Miss Rules

#### Reference Documents

- **Primary**: `_bmad-output/planning-artifacts/architecture.md`
- Contains: All 6 decisions, 12+ patterns, 80+ file locations
- **When uncertain**: Check architecture.md FIRST

#### Anti-Patterns to AVOID

```typescript
// ❌ WRONG: Missing org filter (SECURITY VULNERABILITY)
await db.query.survey.findMany();

// ❌ WRONG: tRPC patterns (oRPC is different!)
client.survey.list.query({ orgId });

// ❌ WRONG: Prisma syntax (Drizzle is different!)
where: { orgId: value }

// ❌ WRONG: npm/yarn commands (use Bun!)
npm install, yarn add

// ❌ WRONG: Response wrappers in oRPC
return { data: survey, success: true };

// ❌ WRONG: Missing form event handling
<form onSubmit={() => form.handleSubmit()}>
// ✅ CORRECT:
<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>

// ❌ WRONG: Using || for defaults
const value = input || 'default';
// ✅ CORRECT: Use ?? for nullish
const value = input ?? 'default';

// ❌ WRONG: Plural table names
pgTable("surveys", ...)

// ❌ WRONG: PascalCase component files
SurveyCard.tsx  // Should be survey-card.tsx

// ❌ WRONG: Real Kapso API calls in tests
new KapsoClient(config)  // Use KapsoMockClient!
```

#### MVP Scope Boundaries

**DO NOT implement (deferred post-MVP):**

- WebSocket real-time updates (use polling)
- Redis/BullMQ queues (use DB job table)
- Email channel (WhatsApp only)
- Multi-region deployment
- Free tier (paid only for MVP)

#### Test Isolation Rules

- NEVER share state between tests
- ALWAYS use fresh test orgs per test
- NEVER rely on test execution order
- Mock ALL external services

#### UI Consistency

- `toast.success()` / `toast.error()` for feedback
- `<Loader />` for pending states
- `cn()` for conditional classes
- Follow existing `components/ui/` patterns

#### Must-Do Checklist

- [ ] Every FlowPulse query has `orgId` filter
- [ ] Using `bun` commands, not npm/yarn
- [ ] oRPC handlers return data directly
- [ ] Drizzle uses `eq()`, `and()`, `or()` helpers
- [ ] Component files are kebab-case
- [ ] Tables are singular lowercase
- [ ] Tests use `KapsoMockClient`
- [ ] Forms have `e.preventDefault()` + `e.stopPropagation()`
- [ ] Using `??` not `||` for defaults

---

_For detailed patterns, see `_bmad-output/planning-artifacts/architecture.md`_

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Check `architecture.md` for detailed patterns

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules

---

_Last Updated: 2025-12-26_
