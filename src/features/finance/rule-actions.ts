"use server";

import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { categories, categoryRules, transactions } from "@/db/schema";
import { fieldErrors } from "@/features/auth/schemas";
import { getActiveRules } from "@/features/ingest/rules";
import { requireUser } from "@/lib/session";
import type { FormState } from "./schemas";

const ruleSchema = z.object({
  pattern: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(60, "Keep it under 60 characters.")
    .transform((v) => v.toUpperCase()),
  categoryId: z.uuid("Pick a category."),
});

function like(pattern: string) {
  return `%${pattern.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function saveRule(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ruleSchema.safeParse({
    pattern: formData.get("pattern") ?? "",
    categoryId: formData.get("categoryId") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  // Imports are expenses, so rules point at the user's active expense categories.
  const [cat] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.id, parsed.data.categoryId),
        eq(categories.userId, user.id),
        eq(categories.type, "expense"),
        isNull(categories.archivedAt),
      ),
    );
  if (!cat) return { status: "error", fieldErrors: { categoryId: "That category isn't available." } };

  const inserted = await db
    .insert(categoryRules)
    .values({ userId: user.id, ...parsed.data })
    .onConflictDoNothing()
    .returning({ id: categoryRules.id });
  if (inserted.length === 0) {
    return { status: "error", fieldErrors: { pattern: "You already have a rule for this text." } };
  }

  refresh();
  return { status: "success", message: "Rule added." };
}

export async function deleteRule(id: string) {
  const user = await requireUser();
  if (typeof id !== "string" || !id) return;
  await db.delete(categoryRules).where(and(eq(categoryRules.id, id), eq(categoryRules.userId, user.id)));
  refresh();
}

/** Categorize existing uncategorized expenses using the current rules. */
export async function applyRulesToUncategorized(): Promise<{ updated: number }> {
  const user = await requireUser();
  const rules = await getActiveRules(user.id); // longest pattern first
  let updated = 0;

  for (const rule of rules) {
    const p = like(rule.pattern);
    const rows = await db
      .update(transactions)
      .set({ categoryId: rule.categoryId })
      .where(
        and(
          eq(transactions.userId, user.id),
          eq(transactions.type, "expense"),
          isNull(transactions.categoryId),
          or(
            ilike(transactions.merchant, p),
            sql`${transactions.metadata}->>'rawMerchant' ilike ${p}`,
            sql`${transactions.metadata}->>'company' ilike ${p}`,
          ),
        ),
      )
      .returning({ id: transactions.id });
    updated += rows.length;
  }

  refresh();
  return { updated };
}
