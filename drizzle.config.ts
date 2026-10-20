import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read .env.local on its own.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Set DIRECT_URL (or DATABASE_URL) in .env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  // Migrations use the direct/session connection (port 5432), not the transaction pooler.
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
