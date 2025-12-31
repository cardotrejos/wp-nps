# Story 3.8: API Documentation

Status: done

## Story

As a **Developer**,
I want to **view API documentation within the dashboard**,
So that **I can understand how to integrate with FlowPulse**.

## Acceptance Criteria

1. **Given** I am on the API settings page **When** I click "Documentation" **Then** I see auto-generated API docs (NFR-I6) **And** docs include endpoints, request/response schemas, and examples

2. **Given** I view an endpoint **When** I read the documentation **Then** I see required headers (Authorization: Bearer {api_key}) **And** I see example curl commands **And** I see error codes and their meanings (NFR-I5)

3. **Given** the API docs are generated **When** I view the survey send endpoint **Then** I see the request body schema **And** I see the response schema **And** I see all possible error responses

4. **Given** the docs page loads **When** I am authenticated **Then** I see my API key prefix displayed **And** I can use the "Try it" feature with my actual key

## Tasks / Subtasks

- [x] Task 1: Add Route Descriptions to oRPC Procedures (AC: #1, #2)
  - [x] 1.1 Update `apps/server/_source/routes/api-v1.ts` with OpenAPI metadata (summary, description, tags, security)
  - [x] 1.2 Add OpenAPI tags for grouping (Surveys, Health)
  - [x] 1.3 Add error schema definitions for common error types (400, 401, 404, 429)

- [x] Task 2: Create OpenAPI Spec Endpoint (AC: #1)
  - [x] 2.1 Add `/api/openapi.json` endpoint in `apps/server/_source/index.ts` (redirects to swagger docs/json)
  - [x] 2.2 Configure spec with title, version, description (using @elysiajs/swagger)
  - [x] 2.3 Add security scheme for Bearer token auth

- [x] Task 3: Create API Documentation Page Component (AC: #1, #2)
  - [x] 3.1 Create `apps/web/src/routes/settings.api-docs.tsx`
  - [x] 3.2 Integrate Scalar (@scalar/api-reference-react) for rendering OpenAPI spec
  - [x] 3.3 Style to match dashboard theme (dark mode enabled)
  - [x] 3.4 Add navigation link in settings (API Documentation card in settings.api.tsx)

- [x] Task 4: Add Example Curl Commands (AC: #2)
  - [x] 4.1 Embedded curl examples in endpoint descriptions (inline in route metadata)
  - [x] 4.2 Examples included in OpenAPI spec via description field
  - [x] 4.3 Include authentication header example in curl commands

- [x] Task 5: Add Error Code Documentation (AC: #2)
  - [x] 5.1 Documented error codes in API description and response schemas
  - [x] 5.2 Document all error codes: 400, 401, 404, 429 (in swagger config and route responses)
  - [x] 5.3 Add error responses to OpenAPI spec (via Elysia swagger plugin)

- [x] Task 6: Write Tests (AC: #1, #2, #3)
  - [x] 6.1 Create `tests/integration/api-docs.test.ts` (12 tests)
  - [x] 6.2 Test OpenAPI spec endpoint returns valid JSON
  - [x] 6.3 Test spec includes all documented endpoints
  - [x] 6.4 Test security schemes, tags, error codes, descriptions

## Dev Notes

### Critical Architecture Compliance

**This story implements FR65 (view API docs in dashboard), NFR-I5 (meaningful error codes), NFR-I6 (auto-generated docs).**

From architecture.md:

- oRPC with @orpc/openapi already configured
- OpenAPIReferencePlugin with ZodToJsonSchemaConverter in use
- RESTful conventions with JSON payloads (NFR-I4)

### Previous Story Context

Story 3-2 established:

- API key generation and authentication
- Bearer token format: `Authorization: Bearer fp_xxx...`

Story 3-3 established:

- Survey send endpoint: POST `/api/v1/surveys/{id}/send`
- Request/response schemas defined with Zod

### Current OpenAPI Setup

The project already has OpenAPI configured in `apps/server/_source/index.ts`:

```typescript
// Already exists - OpenAPI handler
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
});
```

### Adding Route Descriptions

```typescript
// packages/api/src/routers/survey.ts
import { z } from 'zod';
import { protectedProcedure } from '../index';

export const surveySendProcedure = protectedProcedure
  .route({
    method: 'POST',
    path: '/v1/surveys/{surveyId}/send',
    summary: 'Send Survey to Customer',
    description: 'Queue a survey for delivery to a customer phone number via WhatsApp.',
    tags: ['Surveys'],
  })
  .input(z.object({
    surveyId: z.string().describe('Survey ID'),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/).describe('E.164 format phone number'),
    metadata: z.record(z.unknown()).optional().describe('Custom metadata (order_id, customer_name, etc.)'),
  }))
  .output(z.object({
    deliveryId: z.string().describe('Unique delivery tracking ID'),
    status: z.literal('queued').describe('Initial delivery status'),
  }))
  .errors({
    400: z.object({
      code: z.literal('INVALID_PHONE'),
      message: z.string(),
    }),
    401: z.object({
      code: z.literal('UNAUTHORIZED'),
      message: z.string(),
    }),
    404: z.object({
      code: z.literal('SURVEY_NOT_FOUND'),
      message: z.string(),
    }),
    429: z.object({
      code: z.literal('RATE_LIMITED'),
      message: z.string(),
      retryAfter: z.number(),
    }),
  })
  .handler(async ({ input, context }) => {
    // Implementation from Story 3-3
  });
```

### OpenAPI Spec Endpoint

```typescript
// apps/server/_source/index.ts - ADD this endpoint
import { generateOpenAPIDocument } from '@orpc/openapi';

// Add spec endpoint
app.get('/api/openapi.json', () => {
  const spec = generateOpenAPIDocument(appRouter, {
    info: {
      title: 'FlowPulse API',
      version: '1.0.0',
      description: 'WhatsApp NPS survey delivery and response collection API',
    },
    servers: [
      { url: 'https://api.flowpulse.io', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'API key from FlowPulse dashboard. Format: fp_xxx...',
        },
      },
    },
  });
  return spec;
});
```

### Documentation UI Component

```typescript
// apps/web/src/routes/_authenticated/api-docs.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ApiReference } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export const Route = createFileRoute('/_authenticated/api-docs')({
  component: ApiDocsPage,
});

function ApiDocsPage() {
  return (
    <div className="h-full">
      <ApiReference
        configuration={{
          spec: {
            url: `${import.meta.env.VITE_SERVER_URL}/api/openapi.json`,
          },
          darkMode: true,
          hideModels: false,
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
          },
          customCss: `
            .scalar-app {
              --scalar-background-1: hsl(var(--background));
              --scalar-color-1: hsl(var(--foreground));
            }
          `,
        }}
      />
    </div>
  );
}
```

### Error Codes Documentation

```typescript
// packages/api/src/docs/error-codes.ts
export const API_ERROR_CODES = {
  // 400 Bad Request
  INVALID_PHONE: {
    code: 'INVALID_PHONE',
    httpStatus: 400,
    description: 'Phone number must be in E.164 format (e.g., +5511999999999)',
  },
  SURVEY_INACTIVE: {
    code: 'SURVEY_INACTIVE',
    httpStatus: 400,
    description: 'Survey must be active to send. Activate the survey first.',
  },
  INVALID_REQUEST_BODY: {
    code: 'INVALID_REQUEST_BODY',
    httpStatus: 400,
    description: 'Request body failed validation. Check required fields.',
  },

  // 401 Unauthorized
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    httpStatus: 401,
    description: 'API key is missing, invalid, or revoked.',
  },

  // 403 Forbidden
  ORG_LIMIT_EXCEEDED: {
    code: 'ORG_LIMIT_EXCEEDED',
    httpStatus: 403,
    description: 'Monthly survey limit reached. Upgrade your plan.',
  },

  // 404 Not Found
  SURVEY_NOT_FOUND: {
    code: 'SURVEY_NOT_FOUND',
    httpStatus: 404,
    description: 'Survey ID does not exist or belongs to another organization.',
  },

  // 429 Too Many Requests
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    httpStatus: 429,
    description: 'Rate limit exceeded (100 requests/minute). Retry after indicated time.',
    headers: {
      'X-RateLimit-Remaining': 'Requests remaining in current window',
      'X-RateLimit-Reset': 'Unix timestamp when limit resets',
      'Retry-After': 'Seconds to wait before retrying',
    },
  },

  // 500 Internal Server Error
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    httpStatus: 500,
    description: 'Unexpected server error. Contact support if persists.',
  },
} as const;
```

### Example Curl Commands

```typescript
// packages/api/src/docs/examples.ts
export const CURL_EXAMPLES = {
  sendSurvey: `curl -X POST 'https://api.flowpulse.io/api/v1/surveys/srv_abc123/send' \\
  -H 'Authorization: Bearer fp_your_api_key' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phone": "+5511999999999",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_name": "Carlos"
    }
  }'`,

  listDeliveries: `curl 'https://api.flowpulse.io/api/v1/surveys/srv_abc123/deliveries?status=delivered&limit=20' \\
  -H 'Authorization: Bearer fp_your_api_key'`,

  getDeliveryStatus: `curl 'https://api.flowpulse.io/api/v1/deliveries/del_xyz789' \\
  -H 'Authorization: Bearer fp_your_api_key'`,
};
```

### Test Patterns

```typescript
// tests/integration/api-docs.test.ts
import { describe, it, expect } from 'vitest';
import { app } from 'apps/server/_source/index';

describe('API Documentation', () => {
  it('returns valid OpenAPI spec at /api/openapi.json', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/openapi.json')
    );

    expect(response.status).toBe(200);
    const spec = await response.json();

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('FlowPulse API');
    expect(spec.paths).toBeDefined();
  });

  it('includes survey send endpoint in spec', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/openapi.json')
    );
    const spec = await response.json();

    const path = spec.paths['/v1/surveys/{surveyId}/send'];
    expect(path).toBeDefined();
    expect(path.post).toBeDefined();
    expect(path.post.summary).toContain('Send Survey');
  });

  it('includes error schemas', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/openapi.json')
    );
    const spec = await response.json();

    const sendPath = spec.paths['/v1/surveys/{surveyId}/send'].post;
    expect(sendPath.responses['400']).toBeDefined();
    expect(sendPath.responses['401']).toBeDefined();
    expect(sendPath.responses['429']).toBeDefined();
  });

  it('includes security scheme', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/openapi.json')
    );
    const spec = await response.json();

    expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });
});
```

### NFR Compliance

| NFR    | Requirement                   | Implementation                  |
| ------ | ----------------------------- | ------------------------------- |
| NFR-I4 | RESTful conventions with JSON | oRPC with OpenAPI spec          |
| NFR-I5 | Meaningful error codes        | Error schemas with descriptions |
| NFR-I6 | Auto-generated docs from code | @orpc/openapi with Scalar UI    |

### Dependencies to Install

```bash
# For API docs UI (choose one)
bun add @scalar/api-reference-react  # Recommended - modern, dark mode
# OR
bun add swagger-ui-react  # Alternative - classic Swagger UI
```

### Project Structure Notes

Files to create/modify:

- `packages/api/src/routers/survey.ts` - ADD route metadata, descriptions, error schemas
- `packages/api/src/docs/error-codes.ts` - NEW
- `packages/api/src/docs/examples.ts` - NEW
- `apps/server/_source/index.ts` - ADD /api/openapi.json endpoint
- `apps/web/src/routes/_authenticated/api-docs.tsx` - NEW
- `apps/web/src/routes/_authenticated/settings/api.tsx` - ADD link to docs
- `tests/integration/api-docs.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#oRPC Integration]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.8]
- [Source: apps/server/_source/index.ts#OpenAPI Handler]

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Sisyphus/OpenCode)

### Debug Log References

N/A

### Completion Notes List

- Used @elysiajs/swagger instead of @orpc/openapi for OpenAPI spec generation (Elysia native integration)
- Used @scalar/api-reference-react for interactive API documentation UI in dashboard
- Embedded curl examples directly in endpoint descriptions for better discoverability
- OpenAPI spec available at `/api/docs/json`, with redirect from `/api/openapi.json`
- Scalar UI renders at `/settings/api-docs` with dark mode and "Try it" functionality
- All 12 integration tests pass; pre-existing test failures in unrelated files (rls-isolation, survey-delivery) not caused by this implementation

### File List

**Created:**

- `apps/web/src/routes/settings.api-docs.tsx` - API Documentation page with Scalar UI
- `tests/integration/api-docs.test.ts` - Integration tests for API documentation (12 tests)

**Modified:**

- `apps/server/_source/index.ts` - Added @elysiajs/swagger plugin with OpenAPI configuration
- `apps/server/_source/routes/api-v1.ts` - Added OpenAPI metadata (summary, description, tags, security, examples) to all endpoints
- `apps/web/src/routes/settings.api.tsx` - Added "API Documentation" card linking to docs page

**Packages Installed:**

- `@elysiajs/swagger@1.3.1` in `apps/server/`
- `@scalar/api-reference-react@0.8.15` in `apps/web/`

## Change Log

| Date       | Change                          | Reason                                                                                                                                                                                                                      |
| ---------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-12-30 | Initial implementation complete | Story 3-8 API Documentation                                                                                                                                                                                                 |
| 2025-12-30 | Code review fixes applied       | H1: AC4 - Added API key input field with Scalar authentication integration; M1: Removed `any` type in test file using proper TypeScript typing; M2: Added data-testid attributes for E2E testing to both API settings pages |
