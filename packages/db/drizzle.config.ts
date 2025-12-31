import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Only load .env file if DATABASE_URL not already set (allows CI to pass it directly)
if (!process.env.DATABASE_URL) {
  dotenv.config({
    path: "../../apps/server/.env",
  });
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
