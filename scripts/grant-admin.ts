/**
 * Promote an existing account to admin.
 *
 *   npm run admin:grant -- you@example.com
 *
 * Runs with Node's built-in TypeScript support (Node 22.18+).
 */
import { existsSync } from "node:fs";
import postgres from "postgres";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run admin:grant -- <email>");
  process.exit(1);
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set DIRECT_URL or DATABASE_URL in .env.local");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const rows = await sql`
    update users set role = 'admin', updated_at = now()
    where lower(email) = ${email}
    returning email
  `;
  if (rows.length === 0) {
    console.error(`No account found for ${email}. Register first, then run this again.`);
    process.exitCode = 1;
  } else {
    console.log(`${rows[0].email} is now an admin. Sign out and back in to refresh your session.`);
  }
} finally {
  await sql.end();
}
