import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { whatsappConnection } from "@wp-nps/db/schema/flowpulse";
import { KapsoMockClient } from "@wp-nps/kapso";

import { protectedProcedure } from "../index";

// TODO: Replace with real KapsoClient via DI when Kapso integration is complete
// For MVP, using mock client - in production, this should be environment-driven
const kapsoClient = new KapsoMockClient();

// Check if we're in development/test mode (for relaxed validation)
const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

/**
 * WhatsApp Connection Router
 * Handles Setup Link generation, connection status, and connection management.
 *
 * Flow:
 * 1. Client calls createSetupLink -> returns Kapso-hosted URL
 * 2. Client redirects user to Kapso URL
 * 3. User completes Facebook login and WhatsApp connection on Kapso's page
 * 4. Kapso redirects to success/failure URL with query params
 * 5. Client calls confirmConnection with redirect params to save connection
 *
 * CRITICAL: All procedures filter by orgId for multi-tenancy (AR8, AR11)
 */
export const whatsappRouter = {
  /**
   * Create a Setup Link for WhatsApp connection
   * Returns a URL to redirect the user to Kapso's hosted onboarding page
   */
  createSetupLink: protectedProcedure
    .input(
      z.object({
        successRedirectUrl: z.string().url(),
        failureRedirectUrl: z.string().url(),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new Error("No active organization");
      }

      // Call Kapso to create setup link
      const setupLink = await kapsoClient.createSetupLink(orgId, {
        successRedirectUrl: input.successRedirectUrl,
        failureRedirectUrl: input.failureRedirectUrl,
      });

      // Create or update pending connection record
      const existingConnection = await db.query.whatsappConnection.findFirst({
        where: eq(whatsappConnection.orgId, orgId),
      });

      if (existingConnection) {
        // Update existing connection to pending status
        await db
          .update(whatsappConnection)
          .set({
            status: "pending",
            kapsoId: setupLink.id,
            updatedAt: new Date(),
          })
          .where(eq(whatsappConnection.orgId, orgId));
      } else {
        // Create new connection record
        await db.insert(whatsappConnection).values({
          orgId,
          status: "pending",
          kapsoId: setupLink.id,
        });
      }

      return {
        setupLinkId: setupLink.id,
        url: setupLink.url,
        expiresAt: setupLink.expiresAt,
      };
    }),

  /**
   * Confirm WhatsApp connection after successful redirect from Kapso
   * Called with query params from Kapso's success redirect
   *
   * SECURITY: In production, we should verify phone details via Kapso API
   * rather than trusting client-supplied params. For MVP with mock client,
   * we accept client params but validate setup link status strictly.
   */
  confirmConnection: protectedProcedure
    .input(
      z.object({
        setupLinkId: z.string(),
        phoneNumberId: z.string(),
        displayPhoneNumber: z.string(),
        businessAccountId: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new Error("No active organization");
      }

      // First verify this setup link belongs to this org (prevents cross-org attacks)
      const existingConnection = await db.query.whatsappConnection.findFirst({
        where: and(
          eq(whatsappConnection.orgId, orgId),
          eq(whatsappConnection.kapsoId, input.setupLinkId),
        ),
      });

      if (!existingConnection) {
        throw new Error("Setup link not found for this organization");
      }

      if (existingConnection.status === "active") {
        // Already connected, return current state
        return {
          phoneNumber: existingConnection.phoneNumber ?? input.displayPhoneNumber,
          phoneNumberId: input.phoneNumberId,
        };
      }

      // Verify setup link status with Kapso
      const setupLinkStatus = await kapsoClient.getSetupLinkStatus(
        input.setupLinkId,
      );

      // In production: strictly require "completed" status
      // In development/test: also accept "pending" for testing flows
      const isValidStatus =
        setupLinkStatus.status === "completed" ||
        (isDevelopment && setupLinkStatus.status === "pending");

      if (!isValidStatus) {
        throw new Error(
          `Setup link is not completed: ${setupLinkStatus.status}`,
        );
      }

      // TODO: In production, fetch verified phone details from Kapso API
      // instead of trusting client-supplied params. The Kapso API should
      // provide a signed payload or endpoint to verify connection details.
      // For MVP with mock client, we accept client params.

      // Update connection with phone number details
      const result = await db
        .update(whatsappConnection)
        .set({
          status: "active",
          phoneNumber: input.displayPhoneNumber,
          metadata: {
            phoneNumberId: input.phoneNumberId,
            businessAccountId: input.businessAccountId,
          },
          connectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(whatsappConnection.orgId, orgId),
            eq(whatsappConnection.kapsoId, input.setupLinkId),
          ),
        )
        .returning({ id: whatsappConnection.id });

      // Verify we actually updated a row
      if (!result[0]) {
        throw new Error(
          "Failed to update connection - setup link may have expired or been used",
        );
      }

      return {
        phoneNumber: input.displayPhoneNumber,
        phoneNumberId: input.phoneNumberId,
      };
    }),

  /**
   * Get setup link status
   * Used for checking if a pending setup link is still valid
   */
  getSetupLinkStatus: protectedProcedure
    .input(z.object({ setupLinkId: z.string() }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new Error("No active organization");
      }

      // Verify the setup link belongs to this org
      const connection = await db.query.whatsappConnection.findFirst({
        where: and(
          eq(whatsappConnection.orgId, orgId),
          eq(whatsappConnection.kapsoId, input.setupLinkId),
        ),
      });

      if (!connection) {
        throw new Error("Setup link not found for this organization");
      }

      const status = await kapsoClient.getSetupLinkStatus(input.setupLinkId);
      return status;
    }),

  /**
   * Get current WhatsApp connection for the organization
   * Returns null if no connection exists
   */
  getConnection: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new Error("No active organization");
    }

    // CRITICAL: Always filter by orgId for multi-tenancy
    const connection = await db.query.whatsappConnection.findFirst({
      where: eq(whatsappConnection.orgId, orgId),
    });

    return connection ?? null;
  }),

  /**
   * Disconnect WhatsApp connection
   * For future use - allows user to disconnect their WhatsApp
   */
  disconnect: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new Error("No active organization");
    }

    await db
      .update(whatsappConnection)
      .set({
        status: "disconnected",
        updatedAt: new Date(),
      })
      .where(eq(whatsappConnection.orgId, orgId));

    return { disconnected: true };
  }),
};
