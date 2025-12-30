import { Elysia } from "elysia";
import { validateApiKey } from "../services/api-key";

export interface ApiKeyContext {
  orgId: string;
  keyId: string;
}

export const apiKeyAuth = new Elysia({ name: "api-key-auth" }).derive(
  async ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return { apiKeyOrg: null as ApiKeyContext | null };
    }

    const key = authHeader.slice(7);
    const result = await validateApiKey(key);

    return { apiKeyOrg: result };
  }
);

export function requireApiKey(
  apiKeyOrg: ApiKeyContext | null
): asserts apiKeyOrg is ApiKeyContext {
  if (!apiKeyOrg) {
    throw new Response(JSON.stringify({ message: "Invalid or missing API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
