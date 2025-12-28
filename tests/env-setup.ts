/**
 * Environment Setup for Tests
 *
 * This file must be loaded BEFORE any other imports to set up
 * environment variables properly for testing.
 *
 * IMPORTANT: This is a separate file loaded first in vitest.config.ts
 */

// Mock environment variables for tests
process.env["DATABASE_URL"] =
  process.env["TEST_DATABASE_URL"] ?? "postgresql://postgres:password@localhost:5433/wp-nps-test";
process.env["BETTER_AUTH_SECRET"] = "test-secret-for-testing-only-at-least-32-chars-long";
process.env["BETTER_AUTH_URL"] = "http://localhost:3000";
process.env["CORS_ORIGIN"] = "http://localhost:3001";
