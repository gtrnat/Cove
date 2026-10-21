import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { categories, categoryRules } from "@/db/schema";

export type ActiveRule = { pattern: string; categoryId: string };

/** Rules whose category is still active, longest pattern first. */
export async function getActiveRules(userId: string): Promise<ActiveRule[]> {
  const rows = await db
    .select({ pattern: categoryRules.pattern, categoryId: categoryRules.categoryId })
    .from(categoryRules)
    .innerJoin(categories, eq(categories.id, categoryRules.categoryId))
    .where(and(eq(categoryRules.userId, userId), isNull(categories.archivedAt)));
  return rows.sort((a, b) => b.pattern.length - a.pattern.length);
}

export function matchRule(rules: ActiveRule[], ...candidates: (string | undefined)[]) {
  const haystacks = candidates.filter(Boolean).map((c) => c!.toUpperCase());
  return rules.find((r) => haystacks.some((h) => h.includes(r.pattern.toUpperCase())))?.categoryId ?? null;
}
