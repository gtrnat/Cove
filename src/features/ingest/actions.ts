"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { generateApiKey } from "@/lib/api-keys";
import { requireUser } from "@/lib/session";

const MAX_ACTIVE_KEYS = 5;

export type CreateKeyResult = { ok: true; token: string } | { ok: false; message: string };

export async function createApiKey(): Promise<CreateKeyResult> {
  const user = await requireUser();
  const [{ n }] = await db
    .select({ n: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), isNull(apiKeys.revokedAt)));
  if (n >= MAX_ACTIVE_KEYS) {
    return { ok: false, message: `You can have up to ${MAX_ACTIVE_KEYS} active keys. Revoke one first.` };
  }

  const { keyId, secretHash, token } = generateApiKey();
  await db.insert(apiKeys).values({ userId: user.id, name: "Gmail · Apps Script", keyId, secretHash });
  refresh();
  return { ok: true, token };
}

export async function revokeApiKey(id: string) {
  const user = await requireUser();
  if (typeof id !== "string" || !id) return;
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id), isNull(apiKeys.revokedAt)));
  refresh();
}
