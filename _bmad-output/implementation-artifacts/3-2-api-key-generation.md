# Story 3.2: API Key Generation

Status: ready-for-dev

## Story

As a **Developer**,
I want to **generate an API key for my organization**,
So that **I can authenticate API requests programmatically**.

## Acceptance Criteria

1. **Given** I am on the API settings page **When** I click "Generate API Key" **Then** a new API key is generated and displayed once **And** I see a warning "Copy this key now - it won't be shown again" **And** the key is hashed before storage (NFR-S3)

2. **Given** I have an existing API key **When** I generate a new one **Then** the old key is invalidated **And** the new key replaces it

3. **Given** I try to use a revoked API key **When** I make an API request **Then** I receive a 401 Unauthorized response

4. **Given** the API key is generated **When** stored in the database **Then** only the hashed version is stored (never plaintext) **And** the prefix is stored separately for identification

5. **Given** I view the API settings page **When** I have an existing key **Then** I see only the key prefix (e.g., "fp_...abc") **And** the creation date is displayed

## Tasks / Subtasks

- [ ] Task 1: Create API Key Schema (AC: #1, #4)
  - [ ] 1.1 Add `api_key` table to `packages/db/src/schema/flowpulse.ts`
  - [ ] 1.2 Define columns: id, org_id (FK), key_hash, key_prefix, name, created_at, last_used_at, revoked_at
  - [ ] 1.3 Add unique constraint on org_id (one active key per org for MVP)
  - [ ] 1.4 Run `bun db:push` to apply schema

- [ ] Task 2: Create API Key Service (AC: #1, #2, #4)
  - [ ] 2.1 Create `packages/api/src/services/api-key.ts`
  - [ ] 2.2 Implement `generateApiKey(orgId)` - creates key with crypto.randomBytes
  - [ ] 2.3 Implement key format: `fp_${randomBytes(32).toString('hex')}` (64 char hex + prefix)
  - [ ] 2.4 Hash key with SHA-256 before storage
  - [ ] 2.5 Store prefix separately (first 8 chars after `fp_`)
  - [ ] 2.6 Implement `revokeApiKey(orgId)` - sets revoked_at timestamp
  - [ ] 2.7 Implement `validateApiKey(rawKey)` - hash and compare

- [ ] Task 3: Create API Key Router (AC: #1, #2, #5)
  - [ ] 3.1 Create `packages/api/src/routers/api-key.ts`
  - [ ] 3.2 Implement `generate` procedure - creates new key, revokes old
  - [ ] 3.3 Implement `getCurrent` procedure - returns prefix and metadata
  - [ ] 3.4 Implement `revoke` procedure - invalidates current key
  - [ ] 3.5 Add router to main app router

- [ ] Task 4: Create API Key Authentication Middleware (AC: #3)
  - [ ] 4.1 Create `packages/api/src/middleware/api-key-auth.ts`
  - [ ] 4.2 Extract key from `Authorization: Bearer {key}` header
  - [ ] 4.3 Hash incoming key and lookup in database
  - [ ] 4.4 Reject revoked keys with 401
  - [ ] 4.5 Attach org context to request if valid
  - [ ] 4.6 Update `last_used_at` on successful auth

- [ ] Task 5: Create API Settings UI (AC: #1, #2, #5)
  - [ ] 5.1 Create `apps/web/src/routes/_authenticated/settings/api.tsx`
  - [ ] 5.2 Display current key prefix and creation date
  - [ ] 5.3 Add "Generate New Key" button with confirmation modal
  - [ ] 5.4 Show one-time key display with copy button
  - [ ] 5.5 Add warning about key visibility
  - [ ] 5.6 Show "Revoke Key" option

- [ ] Task 6: Write Tests (AC: #1, #2, #3, #4)
  - [ ] 6.1 Create `tests/integration/api-key.test.ts`
  - [ ] 6.2 Test key generation and hashing
  - [ ] 6.3 Test key revocation invalidates old key
  - [ ] 6.4 Test authentication middleware accepts valid key
  - [ ] 6.5 Test authentication middleware rejects invalid/revoked keys
  - [ ] 6.6 Test multi-tenant isolation (org A can't use org B's key)

## Dev Notes

### Critical Architecture Compliance

**This story implements NFR-S3 (API keys hashed, never stored in plaintext).**

From architecture.md:
- API keys must be hashed before storage
- Only store hashed version + prefix for identification
- Use crypto.randomBytes for generation (Bun native)

### Previous Story Context

Stories 3-0 and 3-1 established:
- `IKapsoClient` interface and mock for testing
- `webhook_job` table with job queue infrastructure
- Multi-tenant patterns with `org_id` filtering
- Service layer patterns in `packages/api/src/services/`

This story enables external API authentication for Story 3-3 (Survey Send API).

### API Key Format

```typescript
// Key format: fp_<64 hex characters>
// Example: fp_a1b2c3d4e5f6...
const prefix = 'fp_';
const randomPart = crypto.randomBytes(32).toString('hex'); // 64 chars
const fullKey = `${prefix}${randomPart}`;

// Store separately:
// - key_hash: SHA-256 hash of full key
// - key_prefix: First 8 chars of randomPart (for display: fp_a1b2c3d4...)
```

### Schema Pattern

```typescript
// packages/db/src/schema/flowpulse.ts
export const apiKey = pgTable('api_key', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organization.id),
  keyHash: text('key_hash').notNull(), // SHA-256 hash
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for display
  name: text('name').default('Default API Key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  index('idx_api_key_org').on(table.orgId),
  index('idx_api_key_hash').on(table.keyHash),
]);
```

### Service Pattern

```typescript
// packages/api/src/services/api-key.ts
import { createHash, randomBytes } from 'crypto';
import { db } from '@wp-nps/db';
import { apiKey } from '@wp-nps/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const KEY_PREFIX = 'fp_';

export async function generateApiKey(orgId: string): Promise<string> {
  // Generate random key
  const randomPart = randomBytes(32).toString('hex');
  const fullKey = `${KEY_PREFIX}${randomPart}`;
  
  // Hash for storage
  const keyHash = createHash('sha256').update(fullKey).digest('hex');
  const keyPrefix = randomPart.slice(0, 8);
  
  // Revoke existing key first
  await revokeApiKey(orgId);
  
  // Insert new key
  await db.insert(apiKey).values({
    orgId,
    keyHash,
    keyPrefix,
  });
  
  // Return full key (only time it's visible)
  return fullKey;
}

export async function validateApiKey(rawKey: string): Promise<{ orgId: string } | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }
  
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  
  const result = await db.query.apiKey.findFirst({
    where: and(
      eq(apiKey.keyHash, keyHash),
      isNull(apiKey.revokedAt)
    ),
  });
  
  if (!result) {
    return null;
  }
  
  // Update last used
  await db.update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, result.id));
  
  return { orgId: result.orgId };
}

export async function revokeApiKey(orgId: string): Promise<void> {
  await db.update(apiKey)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(apiKey.orgId, orgId),
      isNull(apiKey.revokedAt)
    ));
}
```

### Authentication Middleware Pattern

```typescript
// packages/api/src/middleware/api-key-auth.ts
import { Elysia } from 'elysia';
import { validateApiKey } from '../services/api-key';

export const apiKeyAuth = new Elysia()
  .derive(async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { apiKeyOrg: null };
    }
    
    const key = authHeader.slice(7); // Remove "Bearer "
    const result = await validateApiKey(key);
    
    return { apiKeyOrg: result };
  })
  .macro(({ onBeforeHandle }) => ({
    requireApiKey(enabled: boolean) {
      if (!enabled) return;
      
      onBeforeHandle(({ apiKeyOrg, error }) => {
        if (!apiKeyOrg) {
          return error(401, { message: 'Invalid or missing API key' });
        }
      });
    },
  }));
```

### UI Component Pattern

```typescript
// apps/web/src/components/settings/api-key-manager.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Key, RefreshCw } from 'lucide-react';

export function ApiKeyManager() {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  
  const { data: currentKey } = useQuery({
    queryKey: ['api-key', 'current'],
    queryFn: () => client.apiKey.getCurrent(),
  });
  
  const generateMutation = useMutation({
    mutationFn: () => client.apiKey.generate(),
    onSuccess: (data) => {
      setNewKey(data.key);
      toast.success('New API key generated');
    },
  });
  
  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success('API key copied to clipboard');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key
        </CardTitle>
        <CardDescription>
          Use this key to authenticate API requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newKey ? (
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm font-medium text-amber-800">
                Copy this key now - it won't be shown again!
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                readOnly
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : currentKey ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current key:</p>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              fp_{currentKey.prefix}...
            </code>
            <p className="text-xs text-muted-foreground">
              Created: {new Date(currentKey.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No API key generated yet</p>
        )}
        
        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          {currentKey ? 'Regenerate Key' : 'Generate Key'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Test Patterns

```typescript
// tests/integration/api-key.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { generateApiKey, validateApiKey, revokeApiKey } from '@wp-nps/api/services/api-key';
import { createTestOrg } from '../support/helpers/test-org';

describe('API Key Service', () => {
  let testOrg: { id: string };

  beforeEach(async () => {
    testOrg = await createTestOrg();
  });

  describe('generateApiKey', () => {
    it('generates a key with correct format', async () => {
      const key = await generateApiKey(testOrg.id);
      
      expect(key).toMatch(/^fp_[a-f0-9]{64}$/);
    });
    
    it('validates the generated key', async () => {
      const key = await generateApiKey(testOrg.id);
      const result = await validateApiKey(key);
      
      expect(result).toEqual({ orgId: testOrg.id });
    });
  });

  describe('revokeApiKey', () => {
    it('invalidates the key after revocation', async () => {
      const key = await generateApiKey(testOrg.id);
      await revokeApiKey(testOrg.id);
      
      const result = await validateApiKey(key);
      expect(result).toBeNull();
    });
  });

  describe('multi-tenant isolation', () => {
    it('prevents using key from different org', async () => {
      const org1 = await createTestOrg('Org 1');
      const org2 = await createTestOrg('Org 2');
      
      const key1 = await generateApiKey(org1.id);
      const result = await validateApiKey(key1);
      
      expect(result?.orgId).toBe(org1.id);
      expect(result?.orgId).not.toBe(org2.id);
    });
  });
});
```

### NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-S3 | API keys hashed, never stored in plaintext | SHA-256 hash stored, plaintext shown once |
| NFR-S4 | Session tokens expire after 24h inactivity | API keys don't expire (explicit revocation) |

### Project Structure Notes

Files to create/modify:
- `packages/db/src/schema/flowpulse.ts` - ADD api_key table
- `packages/api/src/services/api-key.ts` - NEW
- `packages/api/src/routers/api-key.ts` - NEW
- `packages/api/src/middleware/api-key-auth.ts` - NEW
- `apps/web/src/routes/_authenticated/settings/api.tsx` - NEW
- `apps/web/src/components/settings/api-key-manager.tsx` - NEW
- `tests/integration/api-key.test.ts` - NEW

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 6: API Rate Limiting & Usage Metering]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/project-context.md#Security patterns]
- [Source: _bmad-output/implementation-artifacts/3-1-webhook-job-queue-infrastructure.md#Service patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
