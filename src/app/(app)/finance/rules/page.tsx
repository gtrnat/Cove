import { and, asc, count, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/db";
import { categories, categoryRules, transactions } from "@/db/schema";
import { RulesManager } from "@/features/finance/rules-manager";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <>
      <p className="mb-6 max-w-xl text-sm text-muted">
        Rules sort imported receipts into categories. For example, merchants containing{" "}
        <span className="font-mono text-foreground">GOPAY</span> can go straight to Transport.
      </p>
      <Suspense fallback={<div aria-hidden="true" className="h-72 animate-pulse rounded-lg border bg-surface" />}>
        <Rules />
      </Suspense>
    </>
  );
}

async function Rules() {
  const user = await requireUser();
  const [rules, cats, [{ n }]] = await Promise.all([
    db
      .select({
        id: categoryRules.id,
        pattern: categoryRules.pattern,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        archivedAt: categories.archivedAt,
      })
      .from(categoryRules)
      .innerJoin(categories, eq(categories.id, categoryRules.categoryId))
      .where(eq(categoryRules.userId, user.id))
      .orderBy(asc(categoryRules.pattern)),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(and(eq(categories.userId, user.id), eq(categories.type, "expense"), isNull(categories.archivedAt)))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ n: count() })
      .from(transactions)
      .where(
        and(eq(transactions.userId, user.id), eq(transactions.type, "expense"), isNull(transactions.categoryId)),
      ),
  ]);

  return (
    <RulesManager
      rules={rules.map((r) => ({ ...r, archived: r.archivedAt !== null }))}
      categories={cats}
      uncategorized={n}
    />
  );
}
