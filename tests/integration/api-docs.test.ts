import { describe, expect, it, beforeAll } from "vitest";
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { apiV1Router } from "../../apps/server/_source/routes/api-v1";

function createTestApp() {
  return new Elysia()
    .use(
      swagger({
        path: "/api/docs",
        documentation: {
          info: {
            title: "FlowPulse API",
            version: "1.0.0",
            description: `WhatsApp NPS survey delivery and response collection API.

## Authentication

All API endpoints require authentication using a Bearer token.

## Rate Limiting

API requests are rate-limited to **100 requests per minute** per organization.
`,
          },
          servers: [
            { url: "http://localhost:3000", description: "Development" },
          ],
          tags: [
            { name: "Surveys", description: "Survey delivery and management endpoints" },
            { name: "Health", description: "API health and status endpoints" },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "API Key",
                description: "API key from FlowPulse dashboard. Format: fp_xxx...",
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      }),
    )
    .use(apiV1Router)
    .get("/api/openapi.json", () => new Response(null, {
      status: 302,
      headers: { Location: "/api/docs/json" },
    }));
}

describe("API Documentation", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("OpenAPI Spec Endpoint", () => {
    it("returns valid JSON at /api/docs/json", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );

      expect(response.status).toBe(200);

      const spec = await response.json();
      expect(spec).toBeDefined();
      expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);
    });

    it("serves OpenAPI spec at /api/openapi.json via redirect", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openapi.json"),
      );

      const isRedirect = response.status === 302;
      const isFollowedRedirect = response.status === 200;
      expect(isRedirect || isFollowedRedirect).toBe(true);

      if (isRedirect) {
        expect(response.headers.get("location")).toContain("/api/docs/json");
      } else {
        const spec = await response.json();
        expect(spec.openapi).toBeDefined();
      }
    });

    it("includes API title and version in spec", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe("FlowPulse API");
      expect(spec.info.version).toBe("1.0.0");
    });

    it("includes API description with authentication info", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      expect(spec.info.description).toContain("Authentication");
      expect(spec.info.description).toContain("Bearer");
      expect(spec.info.description).toContain("Rate Limiting");
    });

    it("includes survey send endpoint", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      expect(spec.paths).toBeDefined();

      const surveySendPath = spec.paths["/api/v1/surveys/{surveyId}/send"];
      expect(surveySendPath).toBeDefined();
      expect(surveySendPath.post).toBeDefined();
      expect(surveySendPath.post.summary).toBe("Send Survey to Customer");
    });

    it("includes health check endpoint", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      const healthPath = spec.paths["/api/v1/health"];
      expect(healthPath).toBeDefined();
      expect(healthPath.get).toBeDefined();
      expect(healthPath.get.summary).toBe("Health Check");
    });

    it("includes Bearer auth security scheme", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      expect(spec.components).toBeDefined();
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth.type).toBe("http");
      expect(spec.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    });

    it("includes error response schemas for survey send", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      const surveySendPath = spec.paths["/api/v1/surveys/{surveyId}/send"];
      const responses = surveySendPath?.post?.responses;

      expect(responses).toBeDefined();
      expect(responses["202"]).toBeDefined();
      expect(responses["400"]).toBeDefined();
      expect(responses["401"]).toBeDefined();
      expect(responses["404"]).toBeDefined();
      expect(responses["429"]).toBeDefined();
    });

    it("includes request body schema for survey send", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      const surveySendPath = spec.paths["/api/v1/surveys/{surveyId}/send"];
      const requestBody = surveySendPath?.post?.requestBody;

      expect(requestBody).toBeDefined();
      expect(requestBody.content).toBeDefined();
      expect(requestBody.content["application/json"]).toBeDefined();
    });

    it("includes OpenAPI tags for grouping", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      expect(spec.tags).toBeDefined();
      expect(spec.tags.length).toBeGreaterThan(0);

      const tagNames = spec.tags.map((t: { name: string }) => t.name);
      expect(tagNames).toContain("Surveys");
      expect(tagNames).toContain("Health");
    });

    it("survey send endpoint has Surveys tag", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs/json"),
      );
      const spec = await response.json();

      const surveySendPath = spec.paths["/api/v1/surveys/{surveyId}/send"];
      expect(surveySendPath?.post?.tags).toContain("Surveys");
    });
  });

  describe("Swagger UI", () => {
    it("serves Swagger UI at /api/docs", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/docs"),
      );

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html.toLowerCase()).toContain("<!doctype html>");
    });
  });
});
