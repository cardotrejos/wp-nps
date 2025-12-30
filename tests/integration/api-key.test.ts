import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq, and, isNull } from "drizzle-orm";
import { db, apiKey } from "@wp-nps/db";
import {
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  getCurrentApiKey,
} from "../../packages/api/src/services/api-key";
import { requireApiKey } from "../../packages/api/src/middleware/api-key-auth";
import { createTestOrg, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

describe("API Key Service", () => {
  let testOrg: { id: string; name: string; slug: string };

  beforeEach(async () => {
    await clearOrgContext();
    testOrg = await createTestOrg(`API Key Test Org ${Date.now()}`);
  });

  afterEach(async () => {
    await cleanupTestOrg(testOrg.id);
    await clearOrgContext();
  });

  describe("generateApiKey", () => {
    it("generates a key with correct format (fp_ prefix + 64 hex chars)", async () => {
      const key = await generateApiKey(testOrg.id);

      expect(key).toMatch(/^fp_[a-f0-9]{64}$/);
    });

    it("stores hashed key in database (never plaintext)", async () => {
      const key = await generateApiKey(testOrg.id);

      const stored = await db.query.apiKey.findFirst({
        where: and(eq(apiKey.orgId, testOrg.id), isNull(apiKey.revokedAt)),
      });

      expect(stored).toBeDefined();
      expect(stored?.keyHash).not.toBe(key);
      expect(stored?.keyHash).toHaveLength(64);
    });

    it("stores key prefix for display (first 8 chars after fp_)", async () => {
      const key = await generateApiKey(testOrg.id);
      const expectedPrefix = key.slice(3, 11);

      const stored = await db.query.apiKey.findFirst({
        where: and(eq(apiKey.orgId, testOrg.id), isNull(apiKey.revokedAt)),
      });

      expect(stored?.keyPrefix).toBe(expectedPrefix);
    });

    it("revokes existing key when generating new one", async () => {
      const firstKey = await generateApiKey(testOrg.id);
      const secondKey = await generateApiKey(testOrg.id);

      expect(firstKey).not.toBe(secondKey);

      const firstValidation = await validateApiKey(firstKey);
      const secondValidation = await validateApiKey(secondKey);

      expect(firstValidation).toBeNull();
      expect(secondValidation).not.toBeNull();
    });
  });

  describe("validateApiKey", () => {
    it("validates a generated key successfully", async () => {
      const key = await generateApiKey(testOrg.id);
      const result = await validateApiKey(key);

      expect(result).toEqual({
        orgId: testOrg.id,
        keyId: expect.any(String),
      });
    });

    it("rejects invalid key format", async () => {
      const result = await validateApiKey("invalid-key");

      expect(result).toBeNull();
    });

    it("rejects key without fp_ prefix", async () => {
      const result = await validateApiKey("abc123def456");

      expect(result).toBeNull();
    });

    it("rejects key with wrong hash", async () => {
      await generateApiKey(testOrg.id);
      const wrongKey = "fp_" + "a".repeat(64);

      const result = await validateApiKey(wrongKey);

      expect(result).toBeNull();
    });

    it("updates lastUsedAt on successful validation", async () => {
      const key = await generateApiKey(testOrg.id);

      const before = await db.query.apiKey.findFirst({
        where: and(eq(apiKey.orgId, testOrg.id), isNull(apiKey.revokedAt)),
      });
      expect(before?.lastUsedAt).toBeNull();

      await validateApiKey(key);

      const after = await db.query.apiKey.findFirst({
        where: and(eq(apiKey.orgId, testOrg.id), isNull(apiKey.revokedAt)),
      });
      expect(after?.lastUsedAt).not.toBeNull();
    });
  });

  describe("revokeApiKey", () => {
    it("invalidates key after revocation", async () => {
      const key = await generateApiKey(testOrg.id);

      const beforeRevoke = await validateApiKey(key);
      expect(beforeRevoke).not.toBeNull();

      await revokeApiKey(testOrg.id);

      const afterRevoke = await validateApiKey(key);
      expect(afterRevoke).toBeNull();
    });

    it("sets revokedAt timestamp", async () => {
      await generateApiKey(testOrg.id);

      const beforeRevoke = await db.query.apiKey.findFirst({
        where: eq(apiKey.orgId, testOrg.id),
      });
      expect(beforeRevoke?.revokedAt).toBeNull();

      await revokeApiKey(testOrg.id);

      const afterRevoke = await db.query.apiKey.findFirst({
        where: eq(apiKey.orgId, testOrg.id),
      });
      expect(afterRevoke?.revokedAt).not.toBeNull();
    });

    it("returns true when key was revoked", async () => {
      await generateApiKey(testOrg.id);

      const wasRevoked = await revokeApiKey(testOrg.id);

      expect(wasRevoked).toBe(true);
    });

    it("returns false when no active key exists", async () => {
      const wasRevoked = await revokeApiKey(testOrg.id);

      expect(wasRevoked).toBe(false);
    });
  });

  describe("getCurrentApiKey", () => {
    it("returns null when no key exists", async () => {
      const result = await getCurrentApiKey(testOrg.id);

      expect(result).toBeNull();
    });

    it("returns key info when key exists", async () => {
      await generateApiKey(testOrg.id);

      const result = await getCurrentApiKey(testOrg.id);

      expect(result).toEqual({
        id: expect.any(String),
        prefix: expect.any(String),
        name: "Default API Key",
        createdAt: expect.any(Date),
        lastUsedAt: null,
      });
    });

    it("returns null after key is revoked", async () => {
      await generateApiKey(testOrg.id);
      await revokeApiKey(testOrg.id);

      const result = await getCurrentApiKey(testOrg.id);

      expect(result).toBeNull();
    });
  });

  describe("multi-tenant isolation", () => {
    let secondOrg: { id: string; name: string; slug: string };

    beforeEach(async () => {
      secondOrg = await createTestOrg(`API Key Test Org 2 ${Date.now()}`);
    });

    afterEach(async () => {
      await cleanupTestOrg(secondOrg.id);
    });

    it("prevents using key from different org", async () => {
      const org1Key = await generateApiKey(testOrg.id);
      await generateApiKey(secondOrg.id);

      const result = await validateApiKey(org1Key);

      expect(result?.orgId).toBe(testOrg.id);
      expect(result?.orgId).not.toBe(secondOrg.id);
    });

    it("each org has independent key lifecycle", async () => {
      const org1Key = await generateApiKey(testOrg.id);
      const org2Key = await generateApiKey(secondOrg.id);

      await revokeApiKey(testOrg.id);

      const org1Validation = await validateApiKey(org1Key);
      const org2Validation = await validateApiKey(org2Key);

      expect(org1Validation).toBeNull();
      expect(org2Validation).not.toBeNull();
      expect(org2Validation?.orgId).toBe(secondOrg.id);
    });
  });
});

describe("API Key Authentication Middleware", () => {
  describe("requireApiKey helper (AC3: 401 Unauthorized)", () => {
    it("does not throw when valid context provided", () => {
      const validContext = { orgId: "test-org-id", keyId: "test-key-id" };

      expect(() => requireApiKey(validContext)).not.toThrow();
    });

    it("throws 401 Response when apiKeyOrg is null", async () => {
      let thrownResponse: Response | null = null;

      try {
        requireApiKey(null);
      } catch (e) {
        if (e instanceof Response) {
          thrownResponse = e;
        }
      }

      expect(thrownResponse).not.toBeNull();
      expect(thrownResponse?.status).toBe(401);

      const body = (await thrownResponse?.json()) as { message: string };
      expect(body.message).toBe("Invalid or missing API key");
    });

    it("includes JSON content-type header in 401 response", async () => {
      let thrownResponse: Response | null = null;

      try {
        requireApiKey(null);
      } catch (e) {
        if (e instanceof Response) {
          thrownResponse = e;
        }
      }

      expect(thrownResponse?.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
