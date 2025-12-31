import { createHash, randomBytes } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db, apiKey } from "@wp-nps/db";

const KEY_PREFIX = "fp_";

export interface ApiKeyValidationResult {
  orgId: string;
  keyId: string;
}

export interface CurrentApiKeyInfo {
  id: string;
  prefix: string;
  name: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function generateApiKey(orgId: string): Promise<string> {
  const randomPart = randomBytes(32).toString("hex");
  const fullKey = `${KEY_PREFIX}${randomPart}`;

  const keyHash = hashKey(fullKey);
  const keyPrefix = randomPart.slice(0, 8);

  await revokeApiKey(orgId);

  await db.insert(apiKey).values({
    orgId,
    keyHash,
    keyPrefix,
  });

  return fullKey;
}

export async function validateApiKey(rawKey: string): Promise<ApiKeyValidationResult | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashKey(rawKey);

  const result = await db.query.apiKey.findFirst({
    where: and(eq(apiKey.keyHash, keyHash), isNull(apiKey.revokedAt)),
  });

  if (!result) {
    return null;
  }

  await db.update(apiKey).set({ lastUsedAt: new Date() }).where(eq(apiKey.id, result.id));

  return { orgId: result.orgId, keyId: result.id };
}

export async function revokeApiKey(orgId: string): Promise<boolean> {
  const result = await db
    .update(apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKey.orgId, orgId), isNull(apiKey.revokedAt)))
    .returning({ id: apiKey.id });

  return result.length > 0;
}

export async function getCurrentApiKey(orgId: string): Promise<CurrentApiKeyInfo | null> {
  const result = await db.query.apiKey.findFirst({
    where: and(eq(apiKey.orgId, orgId), isNull(apiKey.revokedAt)),
  });

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    prefix: result.keyPrefix,
    name: result.name,
    createdAt: result.createdAt,
    lastUsedAt: result.lastUsedAt,
  };
}
