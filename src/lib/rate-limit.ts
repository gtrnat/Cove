import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Fixed-window rate limit backed by the rate_limits table (shared with
 * Better Auth, so limits hold across serverless instances). One atomic
 * upsert per call: the counter resets once the window has passed.
 */
export async function consumeRateLimit(key: string, windowSeconds: number, max: number) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const rows = await db.execute<{ count: number; last_request: string }>(sql`
    insert into rate_limits (id, key, count, last_request)
    values (${randomUUID()}, ${key}, 1, ${now})
    on conflict (key) do update set
      count = case when rate_limits.last_request < ${now - windowMs} then 1 else rate_limits.count + 1 end,
      last_request = case when rate_limits.last_request < ${now - windowMs} then ${now} else rate_limits.last_request end
    returning count, last_request
  `);
  const row = rows[0];
  const count = Number(row?.count ?? 1);
  const windowStart = Number(row?.last_request ?? now);
  const retryAfter = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
  return { allowed: count <= max, retryAfter };
}

/** True when `key` has already used up `max` in the current window (does not count this call). */
export async function isRateLimited(key: string, windowSeconds: number, max: number) {
  const rows = await db.execute<{ count: number }>(sql`
    select count from rate_limits
    where key = ${key} and last_request >= ${Date.now() - windowSeconds * 1000}
  `);
  return Number(rows[0]?.count ?? 0) >= max;
}

/** Client IP on Vercel (x-real-ip is set by the platform; x-forwarded-for chains are not trusted). */
export function clientIp(headers: Headers) {
  return headers.get("x-real-ip") ?? "unknown";
}
