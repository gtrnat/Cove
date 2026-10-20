"use server";

import { and, eq, isNull, max, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { fieldErrors } from "@/features/auth/schemas";
import { getUserSettings } from "@/features/settings/queries";
import { requireUser } from "@/lib/session";
import { categorySchema, transactionSchema, type FormState } from "./schemas";

/*
 * Every action re-checks the session and scopes writes to the caller's
 * user_id. IDs coming from the client are never trusted on their own.
 */

function readTransactionForm(formData: FormData) {
  return transactionSchema.safeParse({
    type: formData.get("type") ?? "",
    amount: formData.get("amount") ?? "",
    merchant: formData.get("merchant") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    occurredAt: formData.get("occurredAt") ?? "",
    description: formData.get("description") ?? "",
  });
}

/** The category must belong to the user, be active, and match the transaction type. */
async function assertCategory(userId: string, categoryId: string | null, type: "expense" | "income") {
  if (!categoryId) return true;
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId),
        eq(categories.type, type),
        isNull(categories.archivedAt),
      ),
    );
  return Boolean(row);
}

const invalid = (error: Parameters<typeof fieldErrors>[0]): FormState => ({
  status: "error",
  message: "Check the highlighted fields.",
  fieldErrors: fieldErrors(error),
});

export async function saveTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = readTransactionForm(formData);
  if (!parsed.success) return invalid(parsed.error);

  const data = parsed.data;
  if (!(await assertCategory(user.id, data.categoryId, data.type))) {
    return { status: "error", fieldErrors: { categoryId: "That category isn't available." } };
  }

  const { timezone } = await getUserSettings(user.id);
  // Wall-clock time in the user's timezone → UTC instant, done by Postgres.
  const occurredAt = sql`(${data.occurredAt}::timestamp at time zone ${timezone})`;
  const values = {
    type: data.type,
    amount: data.amount,
    merchant: data.merchant,
    categoryId: data.categoryId,
    description: data.description,
    occurredAt,
  };

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    const updated = await db
      .update(transactions)
      .set(values)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .returning({ id: transactions.id });
    if (updated.length === 0) return { status: "error", message: "That transaction no longer exists." };
  } else {
    await db.insert(transactions).values({ ...values, userId: user.id, source: "manual" });
  }

  refresh();
  return { status: "success", message: id ? "Transaction updated." : "Transaction added." };
}

export async function deleteTransaction(id: string): Promise<FormState> {
  const user = await requireUser();
  if (typeof id !== "string" || !id) return { status: "error", message: "Missing transaction." };
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  refresh();
  return { status: "success", message: "Transaction deleted." };
}

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse({
    type: formData.get("type") ?? "",
    name: formData.get("name") ?? "",
    icon: formData.get("icon") ?? "",
    color: formData.get("color") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);

  const id = formData.get("id");
  try {
    if (typeof id === "string" && id) {
      // Type is fixed after creation so existing transactions stay consistent.
      const { name, icon, color } = parsed.data;
      const updated = await db
        .update(categories)
        .set({ name, icon, color })
        .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
        .returning({ id: categories.id });
      if (updated.length === 0) return { status: "error", message: "That category no longer exists." };
    } else {
      const [{ next }] = await db
        .select({ next: max(categories.sortOrder) })
        .from(categories)
        .where(eq(categories.userId, user.id));
      await db
        .insert(categories)
        .values({ ...parsed.data, userId: user.id, sortOrder: (next ?? 0) + 1 });
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "error", fieldErrors: { name: "You already have a category with this name." } };
    }
    throw error;
  }

  refresh();
  return { status: "success", message: id ? "Category updated." : "Category added." };
}

/** Archive hides a category from pickers; its transactions keep it. */
export async function setCategoryArchived(id: string, archived: boolean): Promise<FormState> {
  const user = await requireUser();
  if (typeof id !== "string" || !id) return { status: "error", message: "Missing category." };
  await db
    .update(categories)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)));
  refresh();
  return { status: "success", message: archived ? "Category archived." : "Category restored." };
}
