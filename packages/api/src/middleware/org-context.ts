import { ORPCError, os } from "@orpc/server";
import { db, type DbClient } from "@wp-nps/db";
import { sql } from "drizzle-orm";
import type { Context } from "../context";

/**
 * Org Context Middleware
 *
 * This middleware enforces multi-tenancy by:
 * 1. Requiring an active organization context in the session
 * 2. Setting a PostgreSQL session variable for RLS policies
 * 3. Providing the orgId in context for application-level filtering
 *
 * CRITICAL: All FlowPulse queries MUST include explicit `WHERE org_id = ?` as defense in depth.
 * RLS policies provide a backup layer but should not be the sole protection.
 * Use the `context.db` provided by this middleware so the RLS session variable
 * is applied on the same connection as subsequent queries.
 */

export interface OrgContext {
  orgId: string;
  session: NonNullable<Context["session"]>;
  db: DbClient;
}

export const o = os.$context<Context>();

/**
 * Middleware that requires both authentication AND an active organization
 * Sets PostgreSQL session variable for RLS enforcement
 */
export const requireOrgContext = o.middleware(async ({ context, next }) => {
  // Require authentication
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
  }

  // Require active organization
  const orgId = context.session.activeOrganizationId;
  if (!orgId) {
    throw new ORPCError("FORBIDDEN", {
      message: "No organization context. Please select an organization.",
    });
  }

  return db.transaction(async (tx) => {
    // Set PostgreSQL session variable for RLS policies on the same connection.
    // This enables RLS policies to use: current_setting('app.current_org_id')
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`);

    return next({
      context: {
        orgId,
        session: context.session,
        db: tx as DbClient,
      } satisfies OrgContext,
    });
  });
});

/**
 * Helper to get org-scoped database operations
 * Ensures all queries include orgId filter
 */
export function withOrgFilter<T extends { orgId: string }>(
  orgId: string,
  data: Omit<T, "orgId">,
): T {
  return { ...data, orgId } as T;
}
