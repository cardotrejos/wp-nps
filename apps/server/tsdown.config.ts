import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [
    /@wp-nps\/.*/,
    "@wp-nps/api",
    "@wp-nps/auth",
    "@wp-nps/db",
    "@wp-nps/env",
  ],
});
