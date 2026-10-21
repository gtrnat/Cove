import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { ingestEmails, ingestRequestSchema } from "@/features/ingest/ingest";
import { authenticateApiKey } from "@/lib/api-keys";
import { clientIp, consumeRateLimit, isRateLimited } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 1_000_000;
const FAIL_WINDOW_S = 10 * 60;
const FAIL_MAX = 20;
const KEY_WINDOW_S = 10 * 60;
const KEY_MAX = 60;

function tooMany(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/**
 * Receives raw myBCA receipt emails from a user's Apps Script.
 * Auth: `Authorization: Bearer cove_<keyId>_<secret>` (per-user API key).
 * An empty `emails` array is a connection test.
 */
export async function POST(request: NextRequest) {
  // Failed-auth limit per IP: slows key guessing without punishing shared
  // Google Apps Script egress IPs that are sending valid keys.
  const failKey = `ingest-fail:${clientIp(request.headers)}`;
  if (await isRateLimited(failKey, FAIL_WINDOW_S, FAIL_MAX)) {
    return tooMany(FAIL_WINDOW_S);
  }

  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) {
    await consumeRateLimit(failKey, FAIL_WINDOW_S, FAIL_MAX);
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  // Per-key limit. A normal sync is one request every 5 minutes; a 30-day
  // backfill is at most ~20 batches, so 60 per 10 minutes is generous.
  const keyLimit = await consumeRateLimit(`ingest-key:${auth.keyRowId}`, KEY_WINDOW_S, KEY_MAX);
  if (!keyLimit.allowed) return tooMany(keyLimit.retryAfter);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = ingestRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.issues.slice(0, 5).map((i) => i.message) },
      { status: 400 },
    );
  }

  const results = await ingestEmails(auth.userId, parsed.data.emails);
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, auth.keyRowId));

  return NextResponse.json({ ok: true, results });
}
