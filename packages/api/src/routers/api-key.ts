import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../index";
import { generateApiKey, getCurrentApiKey, revokeApiKey } from "../services/api-key";

export const apiKeyRouter = {
  generate: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const key = await generateApiKey(orgId);

    return { key };
  }),

  getCurrent: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const currentKey = await getCurrentApiKey(orgId);

    if (!currentKey) {
      return null;
    }

    return {
      id: currentKey.id,
      prefix: currentKey.prefix,
      name: currentKey.name,
      createdAt: currentKey.createdAt.toISOString(),
      lastUsedAt: currentKey.lastUsedAt?.toISOString() ?? null,
    };
  }),

  revoke: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No active organization",
      });
    }

    const wasRevoked = await revokeApiKey(orgId);

    if (!wasRevoked) {
      throw new ORPCError("NOT_FOUND", {
        message: "No active API key to revoke",
      });
    }

    return { success: true };
  }),
};
