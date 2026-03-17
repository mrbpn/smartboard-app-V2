/**
 * Applies the generated SQL migration to the Neon database.
 * Usage: npx tsx scripts/migrate.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const migrationsDir = join(process.cwd(), "drizzle");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Running ${files.length} migration(s)…\n`);

  for (const file of files) {
    console.log(`▶ ${file}`);
    const sqlContent = readFileSync(join(migrationsDir, file), "utf-8");
    // Split on statement breakpoints and run each statement
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await sql(stmt);
    }
    console.log(`✓ ${file} applied\n`);
  }

  console.log("✅ All migrations applied!");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Migration failed:", e.message);
  process.exit(1);
});
