import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;

async function runRlsMigration() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log("Connected to database");

    const sqlPath = join(import.meta.dirname, "enable-rls.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    console.log("Running RLS migration...");
    const result = await client.query(sql);

    console.log("RLS migration completed successfully");

    // Log the RLS status result
    if (Array.isArray(result)) {
      const lastResult = result.at(-1);
      if (lastResult?.rows) {
        console.log("\nRLS Status:");
        for (const row of lastResult.rows) {
          const tableRow = row as { tablename: string; rowsecurity: boolean };
          console.log(
            `  ${tableRow.tablename}: ${tableRow.rowsecurity ? "enabled" : "disabled"}`,
          );
        }
      }
    }
  } catch (error) {
    console.error("RLS migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runRlsMigration();
