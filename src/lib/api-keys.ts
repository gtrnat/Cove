import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";

const TOKEN_RE = /^cove_([0-9a-f]{12})_([A-Za-z0-9_-]{32,64})$/;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** New token + the values to store. The token itself is never stored. */
export function generateApiKey() {
  const keyId = randomBytes(6).toString("hex");
  const secret = randomBytes(24).toString("base64url");
  return { keyId, secretHash: sha256(secret), token: `cove_${keyId}_${secret}` };
}

export function maskedKey(keyId: string) {
  return `cove_${keyId}_••••`;
}

/** Resolve an `Authorization: Bearer cove_…` header to an active key, or null. */
export async function authenticateApiKey(header: string | null) {
  const token = header?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const m = token?.match(TOKEN_RE);
  if (!m) return null;
  const [, keyId, secret] = m;

  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId, secretHash: apiKeys.secretHash })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyId, keyId), isNull(apiKeys.revokedAt)));
  if (!row) return null;

  const expected = Buffer.from(row.secretHash, "hex");
  const actual = Buffer.from(sha256(secret), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return { keyRowId: row.id, userId: row.userId };
}
