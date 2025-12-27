import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/**
 * Kapso Test Helpers
 *
 * Helper functions for configuring Kapso mock responses in tests.
 * Use these to set up specific scenarios for your tests.
 */

const KAPSO_API_URL = "https://api.kapso.io/v1";

/**
 * Configure Kapso to return a successful delivery response
 */
export function mockKapsoSuccess(
  deliveryId: string,
  status: "queued" | "sent" | "delivered" = "queued",
): void {
  server.use(
    http.post(`${KAPSO_API_URL}/messages/send`, async () => {
      return HttpResponse.json({
        deliveryId,
        status,
        timestamp: new Date().toISOString(),
      });
    }),
  );
}

/**
 * Configure Kapso to return a failure response
 */
export function mockKapsoFailure(
  errorCode: "rate_limited" | "invalid_phone" | "connection_lost" | "message_failed",
  errorMessage = "Mock error",
): void {
  server.use(
    http.post(`${KAPSO_API_URL}/messages/send`, async () => {
      return HttpResponse.json(
        {
          error: errorCode,
          message: errorMessage,
        },
        { status: 400 },
      );
    }),
  );
}

/**
 * Configure Kapso to simulate rate limiting
 */
export function mockKapsoRateLimited(): void {
  server.use(
    http.post(`${KAPSO_API_URL}/messages/send`, async () => {
      return HttpResponse.json(
        {
          error: "rate_limited",
          message: "Too many requests",
          retryAfter: 60,
        },
        { status: 429 },
      );
    }),
  );
}

/**
 * Configure Kapso to simulate a network error
 */
export function mockKapsoNetworkError(): void {
  server.use(
    http.post(`${KAPSO_API_URL}/messages/send`, async () => {
      return HttpResponse.error();
    }),
  );
}

/**
 * Configure Kapso delivery status response
 */
export function mockKapsoDeliveryStatus(
  deliveryId: string,
  status: "queued" | "sent" | "delivered" | "failed",
): void {
  server.use(
    http.get(`${KAPSO_API_URL}/messages/:id`, async ({ params }) => {
      if (params["id"] === deliveryId) {
        return HttpResponse.json({
          deliveryId,
          status,
          timestamp: new Date().toISOString(),
        });
      }
      return HttpResponse.json({ error: "not_found" }, { status: 404 });
    }),
  );
}

/**
 * Create a webhook payload for testing webhook handlers
 */
export function createWebhookPayload(
  eventType:
    | "message.sent"
    | "message.delivered"
    | "message.read"
    | "message.failed"
    | "response.received",
  deliveryId: string,
  data: Record<string, unknown> = {},
): { payload: string; signature: string } {
  const payload = JSON.stringify({
    eventType,
    deliveryId,
    timestamp: new Date().toISOString(),
    data,
  });

  // Mock signature (in real implementation, this would be HMAC-SHA256)
  const signature = `sha256=${Buffer.from(payload).toString("base64")}`;

  return { payload, signature };
}
