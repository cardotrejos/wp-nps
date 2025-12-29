import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createKapsoClient } from "./factory";
import { KapsoMockClient } from "./mock";
import { KapsoClient } from "./client";

describe("createKapsoClient", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("test environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("returns KapsoMockClient in test environment", () => {
      const client = createKapsoClient();
      expect(client).toBeInstanceOf(KapsoMockClient);
    });

    it("returns KapsoMockClient even when credentials provided", () => {
      const client = createKapsoClient({
        apiKey: "test-api-key",
        webhookSecret: "test-webhook-secret",
      });
      expect(client).toBeInstanceOf(KapsoMockClient);
    });

    it("returns real KapsoClient with forceReal=true", () => {
      const client = createKapsoClient({
        apiKey: "test-api-key",
        webhookSecret: "test-webhook-secret",
        forceReal: true,
      });
      expect(client).toBeInstanceOf(KapsoClient);
    });

    it("throws if forceReal=true but missing credentials", () => {
      expect(() => createKapsoClient({ forceReal: true })).toThrow(
        "KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET are required",
      );
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("returns real KapsoClient with valid credentials", () => {
      const client = createKapsoClient({
        apiKey: "prod-api-key",
        webhookSecret: "prod-webhook-secret",
      });
      expect(client).toBeInstanceOf(KapsoClient);
    });

    it("throws without credentials", () => {
      expect(() => createKapsoClient()).toThrow(
        "KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET are required",
      );
    });

    it("throws with only apiKey", () => {
      expect(() => createKapsoClient({ apiKey: "only-api-key" })).toThrow(
        "KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET are required",
      );
    });

    it("throws with only webhookSecret", () => {
      expect(() => createKapsoClient({ webhookSecret: "only-secret" })).toThrow(
        "KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET are required",
      );
    });
  });

  describe("development environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("returns real KapsoClient with credentials", () => {
      const client = createKapsoClient({
        apiKey: "dev-api-key",
        webhookSecret: "dev-webhook-secret",
      });
      expect(client).toBeInstanceOf(KapsoClient);
    });

    it("throws without credentials", () => {
      expect(() => createKapsoClient()).toThrow(
        "KAPSO_API_KEY and KAPSO_WEBHOOK_SECRET are required",
      );
    });
  });
});
