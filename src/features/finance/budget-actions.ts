"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budgets, categories } from "@/db/schema";
import { requireUser } from "@/lib/session";

type Result = { ok: true } | { ok: false; message: string };

const input = z.object({
  categoryId: z.uuid(),
  /** null clears the budget */
  amount: z.number().int().min(1, "Budget must be more than zero.").max(1_000_000_000_000, "That's too large.").nullable(),
});

export async function setCategoryBudget(categoryId: string, amount: number | null): Promise<Result> {
  const user = await requireUser();
  const parsed = input.safeParse({ categoryId, amount });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid budget." };

  if (parsed.data.amount === null) {
    await db.delete(budgets).where(and(eq(budgets.userId, user.id), eq(budgets.categoryId, categoryId)));
  } else {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, user.id),
          eq(categories.type, "expense"),
          isNull(categories.archivedAt),
        ),
      );
    if (!cat) return { ok: false, message: "That category isn't available." };
    await db
      .insert(budgets)
      .values({ userId: user.id, categoryId, amount: parsed.data.amount })
      .onConflictDoUpdate({ target: [budgets.userId, budgets.categoryId], set: { amount: parsed.data.amount } });
  }
  refresh();
  return { ok: true };
}
