import { http, HttpResponse } from "msw";

/**
 * MSW Request Handlers
 *
 * These handlers mock external API calls for testing.
 * The Kapso API is the primary external dependency.
 */

// Base URL for Kapso API (would be configured via env in real app)
const KAPSO_API_URL = "https://api.kapso.io/v1";

// Mock Kapso API handlers
export const kapsoHandlers = [
  // Send message endpoint
  http.post(`${KAPSO_API_URL}/messages/send`, async () => {
    return HttpResponse.json({
      deliveryId: `kapso-${Date.now()}`,
      status: "queued",
      timestamp: new Date().toISOString(),
    });
  }),

  // Get delivery status endpoint
  http.get(`${KAPSO_API_URL}/messages/:deliveryId`, async ({ params }) => {
    const { deliveryId } = params;
    return HttpResponse.json({
      deliveryId,
      status: "delivered",
      timestamp: new Date().toISOString(),
    });
  }),

  // Webhook verification endpoint
  http.post(`${KAPSO_API_URL}/webhooks/verify`, async () => {
    return HttpResponse.json({ valid: true });
  }),
];

// Combine all handlers
export const handlers = [...kapsoHandlers];
