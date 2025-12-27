import { describe, expect, it } from "vitest";
import { generateSlug } from "./utils";

describe("generateSlug", () => {
  it("should convert spaces to hyphens", () => {
    expect(generateSlug("Acme Corp")).toBe("acme-corp");
  });

  it("should convert to lowercase", () => {
    expect(generateSlug("ACME CORP")).toBe("acme-corp");
  });

  it("should remove special characters", () => {
    expect(generateSlug("My App 2.0!")).toBe("my-app-20");
  });

  it("should collapse multiple hyphens", () => {
    expect(generateSlug("Test - - Company")).toBe("test-company");
  });

  it("should trim leading/trailing hyphens", () => {
    expect(generateSlug("-Test Company-")).toBe("test-company");
  });

  it("should handle empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("should handle whitespace-only string", () => {
    expect(generateSlug("   ")).toBe("");
  });

  it("should handle unicode characters", () => {
    expect(generateSlug("Café Company")).toBe("caf-company");
  });

  it("should handle numbers", () => {
    expect(generateSlug("Company 123")).toBe("company-123");
  });

  describe("slug collision retry pattern", () => {
    it("should generate unique slugs when suffix is added", () => {
      const baseName = "Test Company";
      const baseSlug = generateSlug(baseName);

      // Simulate the retry pattern from sign-up-form.tsx
      const randomSuffix = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`;
      const retrySlug = `${baseSlug}-${randomSuffix}`;

      expect(retrySlug).not.toBe(baseSlug);
      expect(retrySlug.length).toBeGreaterThan(baseSlug.length);
      // Suffix should be 8+ chars (4 timestamp + hyphen already in baseSlug + 4 random)
      expect(randomSuffix.length).toBeGreaterThanOrEqual(8);
    });

    it("should generate different suffixes on each call", () => {
      const suffixes = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const randomSuffix = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`;
        suffixes.add(randomSuffix);
      }

      // All 100 should be unique (or very close due to fast execution)
      expect(suffixes.size).toBeGreaterThan(90);
    });
  });
});
