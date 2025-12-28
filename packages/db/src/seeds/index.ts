import { join } from "node:path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { surveyTemplate } from "../schema/survey-template";
import { surveyTemplateSeeds } from "./survey-templates";

// Load environment from apps/server/.env for standalone execution
dotenv.config({ path: join(import.meta.dirname, "../../../../apps/server/.env") });

/**
 * Seed runner for survey templates (Story 1.5)
 *
 * Idempotent - uses onConflictDoNothing to avoid duplicates.
 * Run via: bun run db:seed
 *
 * Uses direct drizzle connection to bypass strict env validation
 * that requires all server env vars.
 */

export async function seedSurveyTemplates() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create a direct database connection for seeding
  const db = drizzle(databaseUrl);

  console.log("Seeding survey templates...");

  await db.insert(surveyTemplate).values(surveyTemplateSeeds).onConflictDoNothing();

  console.log(`✅ Seeded ${surveyTemplateSeeds.length} survey templates`);
}

// Allow direct execution
if (import.meta.main) {
  seedSurveyTemplates()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
