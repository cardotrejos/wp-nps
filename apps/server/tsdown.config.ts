import { defineConfig } from "tsdown";
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: { index: "./_source/index.ts" },
  format: "esm",
  // Output to src/ so Vercel's Elysia detection picks up the bundled file
  outDir: "./src",
  clean: true,
  // Bundle ALL packages so nothing needs to be resolved at runtime
  noExternal: [/.*/],
  onSuccess: async () => {
    // Rename .mjs files to .js for Vercel detection
    const srcDir = "./src";
    const files = readdirSync(srcDir);
    for (const file of files) {
      if (file.endsWith(".mjs")) {
        const oldPath = join(srcDir, file);
        const newPath = join(srcDir, file.replace(".mjs", ".js"));
        // Also update imports within files to use .js extension
        let content = readFileSync(oldPath, "utf-8");
        content = content.replace(/\.mjs"/g, '.js"');
        content = content.replace(/\.mjs'/g, ".js'");
        writeFileSync(newPath, content);
        // Remove the old .mjs file
        unlinkSync(oldPath);
      }
    }
    console.log("Renamed .mjs files to .js");
  },
});
