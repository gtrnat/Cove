import "server-only";
import { db } from "@/db";
import { categories, userSettings } from "@/db/schema";
import { defaultCategories } from "./defaults";

/**
 * Creates the per-user rows a new account needs. Idempotent: safe to call
 * again if a previous attempt partially failed.
 */
export async function provisionUser(userId: string) {
  await db.transaction(async (tx) => {
    await tx.insert(userSettings).values({ userId }).onConflictDoNothing();
    await tx
      .insert(categories)
      .values(defaultCategories.map((c, i) => ({ ...c, userId, sortOrder: i })))
      .onConflictDoNothing();
  });
}
