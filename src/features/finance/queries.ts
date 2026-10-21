import "server-only";
import { and, asc, count, desc, eq, ilike, isNull, or, sql, sum, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";
import { monthBounds, type MonthKey } from "@/lib/dates";
import type { TransactionFilters } from "./schemas";

/*
 * All queries take userId explicitly and scope every statement to it.
 * Month boundaries are evaluated in the user's timezone inside Postgres, so
 * "October" means October in WIB, not UTC.
 */

function inMonth(month: MonthKey, timeZone: string) {
  const { start, end } = monthBounds(month);
  return and(
    sql`${transactions.occurredAt} >= (${start}::timestamp at time zone ${timeZone})`,
    sql`${transactions.occurredAt} < (${end}::timestamp at time zone ${timeZone})`,
  );
}

export async function getCategories(userId: string, opts: { includeArchived?: boolean } = {}) {
  return db
    .select()
    .from(categories)
    .where(
      and(eq(categories.userId, userId), opts.includeArchived ? undefined : isNull(categories.archivedAt)),
    )
    .orderBy(asc(categories.type), asc(categories.sortOrder), asc(categories.name));
}

export type CategoryOption = Awaited<ReturnType<typeof getCategories>>[number];

/** All categories (archived too) with how many transactions use each. */
export async function getCategoriesWithCounts(userId: string) {
  return db
    .select({
      id: categories.id,
      type: categories.type,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      archivedAt: categories.archivedAt,
      count: count(transactions.id),
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(asc(categories.type), asc(categories.sortOrder), asc(categories.name));
}

/** Expense and income totals for a month. */
export async function getMonthTotals(userId: string, timeZone: string, month: MonthKey) {
  const rows = await db
    .select({ type: transactions.type, total: sum(transactions.amount).mapWith(Number), n: count() })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), inMonth(month, timeZone)))
    .groupBy(transactions.type);

  const expense = rows.find((r) => r.type === "expense");
  const income = rows.find((r) => r.type === "income");
  return {
    expense: expense?.total ?? 0,
    income: income?.total ?? 0,
    count: (expense?.n ?? 0) + (income?.n ?? 0),
  };
}

/** Expense total per local day of the month: { "2026-10-18": 12000, ... } */
export async function getDailyExpenses(userId: string, timeZone: string, month: MonthKey) {
  const day = sql<string>`to_char(${transactions.occurredAt} at time zone ${timeZone}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day, total: sum(transactions.amount).mapWith(Number) })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.type, "expense"), inMonth(month, timeZone)))
    // Group by position: repeating `day` would bind the timezone as a second
    // parameter, and Postgres treats $1 and $8 as different expressions.
    .groupBy(sql`1`);
  return Object.fromEntries(rows.map((r) => [r.day, r.total])) as Record<string, number>;
}

/** Spending per category for a month, largest first. Uncategorized has id null. */
export async function getCategoryBreakdown(
  userId: string,
  timeZone: string,
  month: MonthKey,
  type: "expense" | "income" = "expense",
) {
  const total = sum(transactions.amount).mapWith(Number);
  return db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      total,
      n: count(),
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(eq(transactions.userId, userId), eq(transactions.type, type), inMonth(month, timeZone)))
    .groupBy(categories.id, categories.name, categories.color, categories.icon)
    .orderBy(desc(total));
}

/** Each active expense category with its budget (if any) and this month's spending. */
export async function getBudgetStatus(userId: string, timeZone: string, month: MonthKey) {
  const [cats, limits, spent] = await Promise.all([
    getCategories(userId),
    db.select({ categoryId: budgets.categoryId, amount: budgets.amount }).from(budgets).where(eq(budgets.userId, userId)),
    getCategoryBreakdown(userId, timeZone, month),
  ]);
  const limitBy = new Map(limits.map((l) => [l.categoryId, l.amount]));
  const spentBy = new Map(spent.map((s) => [s.id, s.total]));
  return cats
    .filter((c) => c.type === "expense")
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      budget: limitBy.get(c.id) ?? null,
      spent: spentBy.get(c.id) ?? 0,
    }));
}

export type BudgetLine = Awaited<ReturnType<typeof getBudgetStatus>>[number];

export const PAGE_SIZE = 50;

/** Escape LIKE wildcards so a search for "50%" matches literally. */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listTransactions(
  userId: string,
  timeZone: string,
  opts: { month?: MonthKey; filters?: TransactionFilters; limit?: number },
) {
  const { month, filters = {}, limit = PAGE_SIZE } = opts;
  const page = filters.page ?? 1;

  const where: (SQL | undefined)[] = [eq(transactions.userId, userId)];
  if (month) where.push(inMonth(month, timeZone));
  if (filters.type) where.push(eq(transactions.type, filters.type));
  if (filters.source) where.push(eq(transactions.source, filters.source));
  if (filters.category === "none") where.push(isNull(transactions.categoryId));
  else if (filters.category) where.push(eq(transactions.categoryId, filters.category));
  if (filters.q) {
    const p = likePattern(filters.q);
    where.push(or(ilike(transactions.merchant, p), ilike(transactions.description, p)));
  }
  const condition = and(...where);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        merchant: transactions.merchant,
        description: transactions.description,
        source: transactions.source,
        occurredAt: transactions.occurredAt,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        day: sql<string>`to_char(${transactions.occurredAt} at time zone ${timeZone}, 'YYYY-MM-DD')`,
      })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(condition)
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(transactions).where(condition),
  ]);

  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / limit)) };
}

export type TransactionRow = Awaited<ReturnType<typeof listTransactions>>["rows"][number];
