import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**", "tests/e2e/**"],
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
