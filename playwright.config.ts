import { defineConfig, devices } from "@playwright/test";

/**
 * FlowPulse E2E Test Configuration
 *
 * Timeout Standards (from project-context.md):
 * - Action timeout: 15s (button clicks, form fills)
 * - Navigation timeout: 30s (page loads)
 * - Test timeout: 60s (full test execution)
 * - Assertion timeout: 15s (expect statements)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Timeout configuration
  timeout: 60 * 1000, // Test timeout: 60s
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  use: {
    // Base URL from environment or default to local dev
    baseURL: process.env.BASE_URL || "http://localhost:3001",

    // Artifact capture: failure-only to reduce storage
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Action timeouts
    actionTimeout: 15 * 1000, // 15s for clicks, fills
    navigationTimeout: 30 * 1000, // 30s for navigation
  },

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "test-results/html" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],

  // Browser projects - mobile-first dashboard testing
  projects: [
    // Desktop browsers
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },

    // Mobile devices (FlowPulse is mobile-first)
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],

  // Web server configuration (optional - use when running standalone)
  // webServer: {
  //   command: 'bun run dev:web',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: !process.env.CI,
  // },
});
