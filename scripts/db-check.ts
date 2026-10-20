/**
 * Connectivity check for both database URLs. Prints host/port and errors,
 * never the password.
 *
 *   npm run db:check
 */
import { existsSync } from "node:fs";
import postgres from "postgres";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

for (const key of ["DATABASE_URL", "DIRECT_URL"] as const) {
  const raw = process.env[key];
  if (!raw) {
    console.log(`${key}: not set`);
    continue;
  }
  let label = "(unparseable URL)";
  try {
    const u = new URL(raw);
    label = `${u.username}@${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    console.log(`${key}: not a valid URL. If the password has special characters (@ # / ?), URL-encode them.`);
    continue;
  }
  const sql = postgres(raw, { prepare: false, max: 1, connect_timeout: 10 });
  try {
    const [row] = await sql`select current_user, version()`;
    console.log(`${key}: OK  ${label}  as ${row.current_user}`);
  } catch (error) {
    const e = error as { code?: string; message?: string };
    console.log(`${key}: FAILED  ${label}  ${e.code ?? ""} ${e.message ?? error}`);
  } finally {
    await sql.end({ timeout: 2 });
  }
}
