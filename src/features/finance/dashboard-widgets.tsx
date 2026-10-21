import Link from "next/link";
import { connection } from "next/server";
import { PiggyBank, Receipt, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { currentMonth, daysInMonth, shiftMonth, todayKey } from "@/lib/dates";
import { formatIDR, percentChange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BudgetBar } from "./budget-bar";
import { CategoryIcon } from "./category-badge";
import { getFinanceContext } from "./context";
import { getBudgetStatus, getMonthTotals, listTransactions } from "./queries";
import { TransactionEditor } from "./transaction-editor";
import { TransactionList } from "./transaction-list";

/** "Spent this month" and "Budget left" cards for the dashboard. */
export async function SpendingStats() {
  const { user, timezone, settings } = await getFinanceContext();
  await connection();
  const month = currentMonth(timezone, new Date());
  const [totals, prev] = await Promise.all([
    getMonthTotals(user.id, timezone, month),
    getMonthTotals(user.id, timezone, shiftMonth(month, -1)),
  ]);
  const change = percentChange(totals.expense, prev.expense);
  const budget = settings.monthlyBudget;
  const left = budget ? budget - totals.expense : null;
  const used = budget ? Math.min(totals.expense / budget, 1) : 0;

  return (
    <>
      <StatCard
        label="Spent this month"
        value={formatIDR(totals.expense)}
        icon={Wallet}
        hint={
          change === null
            ? `${totals.count} ${totals.count === 1 ? "transaction" : "transactions"}`
            : `${change <= 0 ? `${Math.abs(change)}% less` : `${change}% more`} than last month`
        }
      />
      <StatCard
        label="Budget left"
        icon={PiggyBank}
        value={
          left === null ? (
            "—"
          ) : (
            <span className={cn(left < 0 && "text-negative")}>
              {left < 0 ? "−" : ""}
              {formatIDR(Math.abs(left))}
            </span>
          )
        }
        hint={
          budget ? (
            `of ${formatIDR(budget)}`
          ) : (
            <Link href="/settings" className="underline-offset-4 hover:text-foreground hover:underline">
              Set a monthly budget
            </Link>
          )
        }
      >
        {budget ? (
          <div
            role="progressbar"
            aria-label="Budget used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(used * 100)}
            className="h-1 overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className={cn("h-full rounded-full", used >= 1 ? "bg-negative" : used >= 0.85 ? "bg-warning" : "bg-accent")}
              style={{ width: `${used * 100}%` }}
            />
          </div>
        ) : null}
      </StatCard>
    </>
  );
}

/** Category budgets closest to (or over) their limit. */
export async function BudgetWatch() {
  const { user, timezone } = await getFinanceContext();
  await connection();
  const month = currentMonth(timezone, new Date());
  const lines = (await getBudgetStatus(user.id, timezone, month))
    .filter((l) => l.budget !== null)
    .sort((a, b) => b.spent / b.budget! - a.spent / a.budget!)
    .slice(0, 4);
  const pace = Number(todayKey(timezone).slice(8, 10)) / daysInMonth(month);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="No category budgets"
        description="Give a few categories a monthly limit and the ones closest to it show up here."
        action={
          <Link href="/finance/budgets" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Set budgets
          </Link>
        }
        className="border-0 py-10"
      />
    );
  }

  return (
    <ul className="space-y-4">
      {lines.map((l) => {
        const left = l.budget! - l.spent;
        return (
          <li key={l.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <CategoryIcon icon={l.icon} color={l.color} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm">{l.name}</p>
              <p className={cn("tabular text-xs", left < 0 ? "text-negative" : "text-muted")}>
                {left < 0 ? `${formatIDR(-left)} over` : `${formatIDR(left)} left`}
              </p>
            </div>
            <BudgetBar spent={l.spent} budget={l.budget!} pace={pace} label={`${l.name} budget used`} />
          </li>
        );
      })}
    </ul>
  );
}

export async function RecentTransactions() {
  const { user, timezone, categoryChoices } = await getFinanceContext();
  const { rows } = await listTransactions(user.id, timezone, { limit: 5 });

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nothing here yet"
        description="Add your first transaction from Finance."
        action={
          <Link href="/finance" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Go to Finance
          </Link>
        }
        className="border-0 py-10"
      />
    );
  }

  return (
    <TransactionEditor categories={categoryChoices} timezone={timezone}>
      <TransactionList rows={rows} timezone={timezone} groupByDay={false} />
    </TransactionEditor>
  );
}
