import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import { whatsappConnection } from "@wp-nps/db/schema/flowpulse";
import { getKapsoClient } from "../lib/kapso";

import { protectedProcedure } from "../index";

// Check if we're in development/test mode (for relaxed validation)
const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

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
        successRedirectUrl: z.url(),
        failureRedirectUrl: z.url(),
      }),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
      }

      const kapsoClient = getKapsoClient();

      const customer = await kapsoClient.getOrCreateCustomer({
        name: `Org ${orgId}`,
        externalCustomerId: orgId,
      });

      const setupLink = await kapsoClient.createSetupLink(customer.id, {
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
        throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
      }

      // First verify this setup link belongs to this org (prevents cross-org attacks)
      const existingConnection = await db.query.whatsappConnection.findFirst({
        where: and(
          eq(whatsappConnection.orgId, orgId),
          eq(whatsappConnection.kapsoId, input.setupLinkId),
        ),
      });

      if (!existingConnection) {
        throw new ORPCError("NOT_FOUND", { message: "Setup link not found for this organization" });
      }

      if (existingConnection.status === "active") {
        // Already connected, return current state
        return {
          phoneNumber: existingConnection.phoneNumber ?? input.displayPhoneNumber,
          phoneNumberId: input.phoneNumberId,
        };
      }

      // Verify setup link status with Kapso
      const setupLinkStatus = await getKapsoClient().getSetupLinkStatus(input.setupLinkId);

      // In production: strictly require "completed" status
      // In development/test: also accept "pending" for testing flows
      const isValidStatus =
        setupLinkStatus.status === "completed" ||
        (isDevelopment && setupLinkStatus.status === "pending");

      if (!isValidStatus) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: `Setup link is not completed: ${setupLinkStatus.status}`,
        });
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
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "Failed to update connection - setup link may have expired or been used",
        });
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
        throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
      }

      // Verify the setup link belongs to this org
      const connection = await db.query.whatsappConnection.findFirst({
        where: and(
          eq(whatsappConnection.orgId, orgId),
          eq(whatsappConnection.kapsoId, input.setupLinkId),
        ),
      });

      if (!connection) {
        throw new ORPCError("NOT_FOUND", { message: "Setup link not found for this organization" });
      }

      const status = await getKapsoClient().getSetupLinkStatus(input.setupLinkId);
      return status;
    }),

  /**
   * Get current WhatsApp connection for the organization
   * Returns null if no connection exists
   */
  getConnection: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
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
      throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
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

  // ==========================================
  // Verification Methods (Story 1.3)
  // ==========================================

  /**
   * Send test message to verify WhatsApp connection
   * Sends a message to verify the connection works
   *
   * Prerequisite: WhatsApp connection must be in "active" status
   */
  sendTestMessage: protectedProcedure
    .input(
      z.object({
        recipientPhone: z.string().optional(),
      }).optional(),
    )
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
      }

      // Get the connected WhatsApp - MUST filter by orgId
      const connection = await db.query.whatsappConnection.findFirst({
        where: and(eq(whatsappConnection.orgId, orgId), eq(whatsappConnection.status, "active")),
      });

      if (!connection?.phoneNumber) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "WhatsApp not connected. Please connect WhatsApp first.",
        });
      }

      // Extract phoneNumberId from connection metadata (set during confirmConnection)
      // This is the WhatsApp/Meta phone number ID, NOT our internal org ID
      const metadata = connection.metadata as { phoneNumberId?: string } | null;
      const phoneNumberId = metadata?.phoneNumberId;

      if (!phoneNumberId) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "WhatsApp configuration not found. Please reconnect WhatsApp.",
        });
      }

      const recipientPhone = input?.recipientPhone ?? connection.phoneNumber;

      const result = await getKapsoClient().sendTestMessage({
        phoneNumber: recipientPhone,
        orgId: phoneNumberId,
      });

    // Store delivery ID in metadata for tracking verification attempts
    const currentMetadata = (connection.metadata as Record<string, unknown>) ?? {};
    await db
      .update(whatsappConnection)
      .set({
        metadata: {
          ...currentMetadata,
          lastTestDeliveryId: result.deliveryId,
          lastTestSentAt: new Date().toISOString(),
          testAttempts: ((currentMetadata.testAttempts as number) ?? 0) + 1,
        },
        updatedAt: new Date(),
      })
      .where(eq(whatsappConnection.id, connection.id));

    return {
      deliveryId: result.deliveryId,
      status: result.status,
    };
  }),

  /**
   * Get verification/delivery status (for polling)
   * Checks with Kapso if the test message was delivered
   */
  getVerificationStatus: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .handler(async ({ context, input }) => {
      const orgId = context.session.session.activeOrganizationId;
      if (!orgId) {
        throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
      }

      // Verify the org has a connection (security check)
      const connection = await db.query.whatsappConnection.findFirst({
        where: eq(whatsappConnection.orgId, orgId),
      });

      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "No WhatsApp connection found for this organization",
        });
      }

      // Check Kapso for delivery status
      const status = await getKapsoClient().getDeliveryStatus(input.deliveryId);

      return {
        deliveryId: input.deliveryId,
        status: status.status,
      };
    }),

  /**
   * Confirm verification manually
   * User clicks "I Received It" to confirm they got the test message
   * Updates connection status from "active" to "verified"
   */
  confirmVerification: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId;
    if (!orgId) {
      throw new ORPCError("UNAUTHORIZED", { message: "No active organization" });
    }

    // Update connection status to verified - MUST filter by orgId AND status
    const result = await db
      .update(whatsappConnection)
      .set({
        status: "verified",
        updatedAt: new Date(),
      })
      .where(and(eq(whatsappConnection.orgId, orgId), eq(whatsappConnection.status, "active")))
      .returning({ id: whatsappConnection.id });

    if (!result[0]) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: "No active WhatsApp connection to verify.",
      });
    }

    return { verified: true };
  }),
};
