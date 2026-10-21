import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { ingestEmails, ingestRequestSchema } from "@/features/ingest/ingest";
import { authenticateApiKey } from "@/lib/api-keys";

const MAX_BODY_BYTES = 1_000_000;

/**
 * Receives raw myBCA receipt emails from a user's Apps Script.
 * Auth: `Authorization: Bearer cove_<keyId>_<secret>` (per-user API key).
 * An empty `emails` array is a connection test.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });

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
