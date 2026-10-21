import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { BudgetBar } from "@/features/finance/budget-bar";
import { BudgetEditor } from "@/features/finance/budget-editor";
import { CategoryIcon } from "@/features/finance/category-badge";
import { getFinanceContext } from "@/features/finance/context";
import { getBudgetStatus, getMonthTotals } from "@/features/finance/queries";
import { currentMonth, daysInMonth, formatMonth, todayKey } from "@/lib/dates";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
      <Budgets />
    </Suspense>
  );
}

async function Budgets() {
  const { user, timezone, settings } = await getFinanceContext();
  await connection();
  const month = currentMonth(timezone);
  const [lines, totals] = await Promise.all([getBudgetStatus(user.id, timezone, month), getMonthTotals(user.id, timezone, month)]);

  const day = Number(todayKey(timezone).slice(8, 10));
  const pace = day / daysInMonth(month);
  const overall = settings.monthlyBudget;
  const budgeted = lines.filter((l) => l.budget !== null);
  const unbudgeted = lines.filter((l) => l.budget === null);
  const sumBudgets = budgeted.reduce((s, l) => s + l.budget!, 0);

  return (
    <div className="space-y-6">
      <p className="max-w-xl text-sm text-muted">
        Monthly limits for {formatMonth(month)}. They repeat every month. The marker on each bar shows how far through
        the month you are, so a bar past its marker is ahead of plan.
      </p>

      <section aria-label="Overall" className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Monthly budget"
          icon={PiggyBank}
          value={overall ? formatIDR(overall) : "—"}
          hint={
            <Link href="/settings" className="underline-offset-4 hover:text-foreground hover:underline">
              {overall ? "Change in Settings" : "Set one in Settings"}
            </Link>
          }
        >
          {overall ? <BudgetBar spent={totals.expense} budget={overall} pace={pace} label="Overall budget used" /> : null}
        </StatCard>
        <StatCard
          label="Spent so far"
          value={formatIDR(totals.expense)}
          hint={overall ? (totals.expense > overall ? `${formatIDR(totals.expense - overall)} over` : `${formatIDR(overall - totals.expense)} left`) : `Day ${day} of ${daysInMonth(month)}`}
        />
        <StatCard
          label="Category budgets"
          value={formatIDR(sumBudgets)}
          hint={
            overall && sumBudgets > overall
              ? `${formatIDR(sumBudgets - overall)} more than your monthly budget`
              : `${budgeted.length} of ${lines.length} categories`
          }
        />
      </section>

      {budgeted.length > 0 && (
        <section aria-labelledby="budgeted">
          <h2 id="budgeted" className="mb-3 text-[15px] font-medium">
            With a budget
          </h2>
          <ul className="divide-y rounded-lg border bg-surface">
            {budgeted.map((l) => {
              const left = l.budget! - l.spent;
              return (
                <li key={l.id} className="space-y-2.5 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={l.icon} color={l.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/finance/transactions?type=expense&category=${l.id}`}
                        className="truncate text-sm hover:underline hover:underline-offset-4"
                      >
                        {l.name}
                      </Link>
                      <p className="tabular text-xs text-muted">
                        {formatIDR(l.spent)} of {formatIDR(l.budget!)}
                      </p>
                    </div>
                    <p className={cn("tabular text-right text-sm", left < 0 ? "text-negative" : "text-foreground")}>
                      {left < 0 ? `${formatIDR(-left)} over` : `${formatIDR(left)} left`}
                    </p>
                    <BudgetEditor categoryId={l.id} name={l.name} budget={l.budget} />
                  </div>
                  <BudgetBar spent={l.spent} budget={l.budget!} pace={pace} label={`${l.name} budget used`} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="unbudgeted">
        <h2 id="unbudgeted" className="mb-3 text-[15px] font-medium">
          {budgeted.length ? "No budget yet" : "Set a budget per category"}
        </h2>
        {unbudgeted.length === 0 ? (
          <Card className="px-4 py-6 text-center text-sm text-muted">Every category has a budget.</Card>
        ) : (
          <ul className="divide-y rounded-lg border bg-surface">
            {unbudgeted.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                <CategoryIcon icon={l.icon} color={l.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{l.name}</p>
                  <p className="tabular text-xs text-muted">{formatIDR(l.spent)} this month</p>
                </div>
                <BudgetEditor categoryId={l.id} name={l.name} budget={null} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
