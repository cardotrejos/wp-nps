import { Resend } from "resend";
import { env } from "@wp-nps/env/server";

/**
 * Email client interface for testability (Story 3.9)
 * Allows swapping between real Resend client and mock for tests
 */
export interface IEmailClient {
  send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ id: string }>;
}

/**
 * Production email client using Resend
 */
class ResendEmailClient implements IEmailClient {
  private client: Resend;

  constructor() {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required for email functionality");
    }
    this.client = new Resend(env.RESEND_API_KEY);
  }

  async send(params: { to: string; subject: string; html: string; from?: string }) {
    const result = await this.client.emails.send({
      from: params.from ?? "FlowPulse <noreply@flowpulse.io>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      throw new Error(`Email send failed: ${result.error.message}`);
    }

    return { id: result.data?.id ?? "unknown" };
  }
}

/**
 * Mock email client for testing
 * Captures sent emails for assertion
 */
export class MockEmailClient implements IEmailClient {
  public sentEmails: Array<{ to: string; subject: string; html: string; from?: string }> = [];

  async send(params: { to: string; subject: string; html: string; from?: string }) {
    this.sentEmails.push(params);
    return { id: `mock-${Date.now()}` };
  }

  reset() {
    this.sentEmails = [];
  }
}

// Singleton instances
let emailClientInstance: IEmailClient | null = null;
let mockClientInstance: MockEmailClient | null = null;

/**
 * Get the email client singleton
 * Uses MockEmailClient in test environment, ResendEmailClient otherwise
 */
export function getEmailClient(): IEmailClient {
  if (env.NODE_ENV === "test") {
    if (!mockClientInstance) {
      mockClientInstance = new MockEmailClient();
    }
    return mockClientInstance;
  }

  if (!emailClientInstance) {
    emailClientInstance = new ResendEmailClient();
  }
  return emailClientInstance;
}

/**
 * Get the mock email client for test assertions
 * Throws if not in test environment
 */
export function getMockEmailClient(): MockEmailClient {
  if (env.NODE_ENV !== "test") {
    throw new Error("getMockEmailClient is only available in test environment");
  }
  if (!mockClientInstance) {
    mockClientInstance = new MockEmailClient();
  }
  return mockClientInstance;
}

/**
 * Reset the mock email client (for test cleanup)
 */
export function resetMockEmailClient(): void {
  if (mockClientInstance) {
    mockClientInstance.reset();
  }
}
