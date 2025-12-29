# Story 3.0: Kapso Integration Package

Status: completed

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want to **have a dedicated Kapso integration package with interface abstraction**,
So that **all Kapso API calls go through a consistent, testable interface**.

## Acceptance Criteria

1. **Given** the codebase **When** I need to interact with Kapso **Then** I import from `@wp-nps/kapso` package **And** I use the `IKapsoClient` interface (AR2)

2. **Given** I am writing tests **When** I need to mock Kapso **Then** I use `KapsoMockClient` which implements `IKapsoClient` (AR3) **And** no real API calls are made in CI

3. **Given** I am writing webhook tests **When** I use `KapsoMockClient` **Then** I can call `mockValidSignature()` and `mockInvalidSignature()` **And** signature verification behavior is testable without real Kapso

4. **Given** I configure the real `KapsoClient` **When** I provide the API key **Then** it authenticates using `X-API-Key` header **And** uses the official Kapso SDK internally

5. **Given** I need to send a survey message **When** I call `client.sendSurvey(params)` **Then** it uses Kapso's WhatsApp Cloud API **And** returns a delivery result with `deliveryId` and `status`

6. **Given** I receive a Kapso webhook **When** I need to verify the signature **Then** I call `client.verifyWebhook(signature, payload)` **And** it uses HMAC-SHA256 verification

## Tasks / Subtasks

- [x] Task 1: Install Kapso Official SDK (AC: #4)
  - [x] 1.1 Add `@kapso/whatsapp-cloud-api` to `packages/kapso/package.json`
  - [x] 1.2 Run `bun install` to install the dependency
  - [x] 1.3 Verify SDK is accessible and types are available

- [x] Task 2: Create Real KapsoClient Implementation (AC: #1, #4, #5)
  - [x] 2.1 Create `packages/kapso/src/client.ts` with `KapsoClient` class
  - [x] 2.2 Implement constructor accepting `apiKey` and optional `baseUrl`
  - [x] 2.3 Initialize internal `WhatsAppClient` from Kapso SDK
  - [x] 2.4 Implement `sendSurvey()` - calls `client.messages.sendText()` with text message
  - [x] 2.5 Implement `sendTestMessage()` - sends verification message
  - [x] 2.6 Implement `getDeliveryStatus()` - placeholder (status comes via webhooks)
  - [x] 2.7 Implement `createSetupLink()` - calls Platform API for onboarding
  - [x] 2.8 Implement `getSetupLinkStatus()` - checks setup link status
  - [x] 2.9 Implement `verifyWebhook()` using Kapso SDK's `verifySignature()`

- [x] Task 3: Add Environment Configuration (AC: #4)
  - [x] 3.1 Add `KAPSO_API_KEY` to `packages/env/src/server.ts` schema
  - [x] 3.2 Add `KAPSO_WEBHOOK_SECRET` for signature verification

- [x] Task 4: Create Kapso Client Factory (AC: #1, #2)
  - [x] 4.1 Create `packages/kapso/src/factory.ts` with `createKapsoClient()`
  - [x] 4.2 Factory returns `KapsoMockClient` when `NODE_ENV=test`
  - [x] 4.3 Factory returns real `KapsoClient` in production
  - [x] 4.4 Export factory from package index

- [x] Task 5: Enhance Mock Client Webhook Verification (AC: #3)
  - [x] 5.1 Add `mockValidSignature(signature: string)` method
  - [x] 5.2 Add `mockInvalidSignature(signature: string)` method
  - [x] 5.3 Update `verifyWebhook()` to check configured signatures
  - [x] 5.4 Add `setDefaultWebhookVerification()` method

- [x] Task 6: Update Package Exports (AC: #1, #2)
  - [x] 6.1 Export `KapsoClient` from `packages/kapso/src/index.ts`
  - [x] 6.2 Export `createKapsoClient` factory function
  - [x] 6.3 Export types `KapsoClientConfig` and `KapsoFactoryConfig`

- [x] Task 7: Write Integration Tests (AC: #2, #3, #6)
  - [x] 7.1 Create `packages/kapso/src/factory.test.ts` for factory tests
  - [x] 7.2 Test factory returns correct client based on environment
  - [x] 7.3 Test factory throws without credentials in production
  - [x] 7.4 Test mock client signature mocking methods in mock.test.ts
  - [x] 7.5 Run all tests and verify passing (49 tests in kapso package)

- [x] Task 8: Update Existing Usages (AC: #1)
  - [x] 8.1 Update `packages/api/src/lib/kapso.ts` to use factory
  - [x] 8.2 Run existing tests to ensure no regressions

### Review Follow-ups (AI)
- [ ] [AI-Review][MEDIUM] Add MSW-based contract tests for KapsoClient Platform API calls (createSetupLink, getSetupLinkStatus) [packages/kapso/src/client.test.ts]

## Dev Notes

### Critical Architecture Compliance

**This story completes the Kapso package - mock client already exists, real client needs implementation.**

### Current State

The package `packages/kapso/` already has:
- `IKapsoClient` interface with all methods defined
- `KapsoMockClient` fully implemented
- Types for all Kapso operations (surveys, setup links, webhooks)

What's missing:
- Real `KapsoClient` implementation
- Kapso SDK integration
- Webhook signature verification with real HMAC

### Kapso API Research (VERIFIED)

**Authentication:**
```typescript
// API Key header for all requests
headers: { 'X-API-Key': process.env.KAPSO_API_KEY }

// TypeScript SDK initialization
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

const client = new WhatsAppClient({
  baseUrl: 'https://api.kapso.ai/meta/whatsapp',
  kapsoApiKey: process.env.KAPSO_API_KEY!
});
```

**Webhook Signature Verification:**
```typescript
import { verifySignature } from '@kapso/whatsapp-cloud-api/server';

// Header: X-Webhook-Signature (HMAC-SHA256)
const isValid = verifySignature({
  appSecret: process.env.KAPSO_WEBHOOK_SECRET,
  rawBody: requestBody,
  signatureHeader: headers['x-webhook-signature']
});
```

**Webhook Event Types:**
- `whatsapp.message.received` - Customer response (NPS score)
- `whatsapp.message.sent` - Message sent confirmation
- `whatsapp.message.delivered` - Delivery confirmation
- `whatsapp.message.failed` - Delivery failure
- `whatsapp.phone_number.created` - Setup link completed

**Webhook Payload v2 Structure:**
```typescript
interface KapsoWebhookPayload {
  phone_number_id: string;
  message: {
    phone_number: string;
    content: string;
    whatsapp_message_id: string;
    type: string;
    kapso: {
      direction: 'inbound' | 'outbound';
      origin: string;
    };
  };
  conversation: {
    id: string;
    phone_number: string;
    phone_number_id: string;
  };
}
```

**Setup Links API:**
```typescript
// POST https://api.kapso.ai/platform/v1/customers/{customerId}/setup_links
const response = await fetch(
  `https://api.kapso.ai/platform/v1/customers/${customerId}/setup_links`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      setup_link: {
        success_redirect_url: 'https://app.flowpulse.io/onboarding/success',
        failure_redirect_url: 'https://app.flowpulse.io/onboarding/error',
        allowed_connection_types: ['coexistence', 'dedicated'],
      }
    })
  }
);

// Success redirect query params:
// ?setup_link_id=xxx&status=completed&phone_number_id=xxx&display_phone_number=xxx
```

### KapsoClient Implementation

```typescript
// packages/kapso/src/client.ts
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
import { verifySignature } from '@kapso/whatsapp-cloud-api/server';
import type {
  IKapsoClient,
  SendSurveyParams,
  SendTestParams,
  SetupLinkConfig,
  SetupLinkResult,
  SurveyDeliveryResult,
} from './types';

interface KapsoClientConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl?: string;
  platformBaseUrl?: string;
}

export class KapsoClient implements IKapsoClient {
  private whatsappClient: WhatsAppClient;
  private webhookSecret: string;
  private platformBaseUrl: string;
  private apiKey: string;

  constructor(config: KapsoClientConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
    this.platformBaseUrl = config.platformBaseUrl ?? 'https://api.kapso.ai/platform/v1';

    this.whatsappClient = new WhatsAppClient({
      baseUrl: config.baseUrl ?? 'https://api.kapso.ai/meta/whatsapp',
      kapsoApiKey: config.apiKey,
    });
  }

  async sendSurvey(params: SendSurveyParams): Promise<SurveyDeliveryResult> {
    // Use the WhatsApp client to send a text message with survey link
    const response = await this.whatsappClient.messages.send({
      phoneNumberId: params.orgId, // Map orgId to phoneNumberId
      to: params.phoneNumber,
      type: 'text',
      text: { body: params.message },
    });

    return {
      deliveryId: response.messages[0].id,
      status: 'queued',
      timestamp: new Date().toISOString(),
    };
  }

  async sendTestMessage(params: SendTestParams): Promise<SurveyDeliveryResult> {
    const response = await this.whatsappClient.messages.send({
      phoneNumberId: params.orgId,
      to: params.phoneNumber,
      type: 'text',
      text: { body: 'FlowPulse test message - if you received this, your WhatsApp is connected!' },
    });

    return {
      deliveryId: response.messages[0].id,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }

  async getDeliveryStatus(deliveryId: string): Promise<SurveyDeliveryResult> {
    // Note: Kapso doesn't have a direct status endpoint
    // Status comes via webhooks. This is a placeholder.
    return {
      deliveryId,
      status: 'queued',
      timestamp: new Date().toISOString(),
    };
  }

  verifyWebhook(signature: string, payload: string): boolean {
    return verifySignature({
      appSecret: this.webhookSecret,
      rawBody: payload,
      signatureHeader: signature,
    });
  }

  async createSetupLink(customerId: string, config: SetupLinkConfig): Promise<SetupLinkResult> {
    const response = await fetch(
      `${this.platformBaseUrl}/customers/${customerId}/setup_links`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setup_link: {
            success_redirect_url: config.successRedirectUrl,
            failure_redirect_url: config.failureRedirectUrl,
            allowed_connection_types: config.allowedConnectionTypes,
            provision_phone_number: config.provisionPhoneNumber,
            phone_number_country_isos: config.phoneNumberCountryIsos,
            theme_config: config.themeConfig,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create setup link: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.data.id,
      url: data.data.url,
      expiresAt: data.data.expires_at,
      status: 'pending',
    };
  }

  async getSetupLinkStatus(setupLinkId: string): Promise<SetupLinkResult> {
    const response = await fetch(
      `${this.platformBaseUrl}/setup_links/${setupLinkId}`,
      {
        headers: { 'X-API-Key': this.apiKey },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get setup link status: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.data.id,
      url: data.data.url,
      expiresAt: data.data.expires_at,
      status: data.data.status,
    };
  }
}
```

### Factory Pattern

```typescript
// packages/kapso/src/factory.ts
import { KapsoClient } from './client';
import { KapsoMockClient } from './mock';
import type { IKapsoClient } from './types';

export function createKapsoClient(): IKapsoClient {
  if (process.env.NODE_ENV === 'test') {
    return new KapsoMockClient();
  }

  const apiKey = process.env.KAPSO_API_KEY;
  const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    throw new Error('KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET must be set');
  }

  return new KapsoClient({
    apiKey,
    webhookSecret,
    baseUrl: process.env.KAPSO_BASE_URL,
  });
}
```

### Environment Variables

```bash
# .env.example additions
KAPSO_API_KEY=your_kapso_api_key_here
KAPSO_WEBHOOK_SECRET=your_webhook_secret_here
KAPSO_BASE_URL=https://api.kapso.ai/meta/whatsapp
```

### Test Patterns

```typescript
// packages/kapso/src/client.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { KapsoMockClient } from './mock';
import { createKapsoClient } from './factory';

describe('KapsoMockClient', () => {
  let client: KapsoMockClient;

  beforeEach(() => {
    client = new KapsoMockClient();
    client.reset();
  });

  describe('verifyWebhook', () => {
    it('returns true by default', () => {
      expect(client.verifyWebhook('any-signature', 'any-payload')).toBe(true);
    });

    it('returns false when mockInvalidSignature is set', () => {
      client.mockInvalidSignature('bad-sig');
      expect(client.verifyWebhook('bad-sig', 'payload')).toBe(false);
    });

    it('returns true for mocked valid signatures', () => {
      client.mockValidSignature('good-sig');
      expect(client.verifyWebhook('good-sig', 'payload')).toBe(true);
    });
  });
});

describe('createKapsoClient factory', () => {
  it('returns KapsoMockClient in test environment', () => {
    process.env.NODE_ENV = 'test';
    const client = createKapsoClient();
    expect(client).toBeInstanceOf(KapsoMockClient);
  });
});
```

### Multi-Tenancy Considerations

The `phoneNumberId` from Kapso maps to each organization's connected WhatsApp:
- Store `phoneNumberId` in `whatsapp_connection` table
- Use org's `phoneNumberId` when sending messages
- Webhook routing uses `phone_number_id` to identify which org

### Existing Code References

Current package structure:
- `packages/kapso/src/index.ts` - Package entry point
- `packages/kapso/src/types.ts` - All type definitions
- `packages/kapso/src/mock.ts` - Complete mock implementation
- `packages/kapso/src/mock.test.ts` - Mock client tests

Current usage in server:
- `apps/server/src/lib/kapso.ts` - Kapso client instantiation

### Definition of Done

- [x] Real `KapsoClient` implements all `IKapsoClient` methods
- [x] Factory returns mock in tests, real in production
- [x] Webhook verification uses HMAC-SHA256 (via Kapso SDK's verifySignature)
- [x] Environment variables added to server env schema
- [x] All existing tests pass (49 tests in kapso package)
- [x] New integration tests for webhook verification and factory
- [x] No real API calls made in CI (factory returns mock in NODE_ENV=test)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created with Kapso API research | SM Agent |
| 2025-12-29 | Story completed - all tasks implemented and 49 tests passing | Dev |
| 2025-12-29 | Code review: Fixed H1 (env validation), H2 (zod parsing), M1 (KAPSO_BASE_URL), M5 (URL constants). Added 1 action item for contract tests. | AI Review |
