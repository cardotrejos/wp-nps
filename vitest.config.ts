import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@wp-nps/db/schema/flowpulse": path.resolve(__dirname, "./packages/db/src/schema/flowpulse.ts"),
      "@wp-nps/db/schema/auth": path.resolve(__dirname, "./packages/db/src/schema/auth.ts"),
      "@wp-nps/db/schema/survey-template": path.resolve(__dirname, "./packages/db/src/schema/survey-template.ts"),
      "@wp-nps/db/schema": path.resolve(__dirname, "./packages/db/src/schema"),
      "@wp-nps/db": path.resolve(__dirname, "./packages/db/src"),
      "@wp-nps/kapso": path.resolve(__dirname, "./packages/kapso/src"),
      "@wp-nps/api": path.resolve(__dirname, "./packages/api/src"),
    },
  },
  test: {
    globals: true,
    root: "./",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**", "tests/e2e/**", "apps/web/**"],
    environment: "node",
    setupFiles: ["./tests/env-setup.ts", "./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.*",
        "**/tests/**",
        "**/_bmad*/**",
        "**/docs/**",
        "**/.turbo/**",
        // Schema files are declarative - coverage from integration tests using them
        "**/db/src/schema/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    isolate: false,
  },
});
