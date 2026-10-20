import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowDownLeft, ArrowUpRight, Receipt, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { CategoryBreakdown } from "@/features/finance/category-breakdown";
import { getFinanceContext } from "@/features/finance/context";
import { DailyChart } from "@/features/finance/daily-chart";
import { resolveMonth } from "@/features/finance/month-param";
import { MonthSwitcher } from "@/features/finance/month-switcher";
import {
  getCategoryBreakdown,
  getDailyExpenses,
  getMonthTotals,
  listTransactions,
} from "@/features/finance/queries";
import { AddTransactionButton, TransactionEditor } from "@/features/finance/transaction-editor";
import { TransactionList } from "@/features/finance/transaction-list";
import { shiftMonth, todayKey } from "@/lib/dates";
import { formatIDR, percentChange } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Finance" };

export default function FinanceOverviewPage(props: PageProps<"/finance">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: Pick<PageProps<"/finance">, "searchParams">) {
  const [{ user, timezone, categoryChoices }, params] = await Promise.all([getFinanceContext(), searchParams]);
  await connection(); // "this month" depends on the current time
  const now = new Date();
  const { month, current } = resolveMonth(params.month, timezone, now);
  const prev = shiftMonth(month, -1);

  const [totals, prevTotals, daily, breakdown, recent] = await Promise.all([
    getMonthTotals(user.id, timezone, month),
    getMonthTotals(user.id, timezone, prev),
    getDailyExpenses(user.id, timezone, month),
    getCategoryBreakdown(user.id, timezone, month),
    listTransactions(user.id, timezone, { month, limit: 6 }),
  ]);

  const net = totals.income - totals.expense;
  const change = percentChange(totals.expense, prevTotals.expense);
  const hrefFor = (m: string) => (m === current ? "/finance" : `/finance?month=${m}`);

  return (
    <TransactionEditor categories={categoryChoices} timezone={timezone}>
      <div className="space-y-6">
        <MonthSwitcher month={month} current={current} hrefFor={hrefFor} />

        <section aria-label="Totals" className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Expenses"
            value={formatIDR(totals.expense)}
            icon={ArrowUpRight}
            hint={
              change === null ? (
                "No spending last month to compare"
              ) : (
                <>
                  <span className={change <= 0 ? "text-positive" : "text-negative"}>
                    {change <= 0 ? `${Math.abs(change)}% less` : `${change}% more`}
                  </span>{" "}
                  than last month
                </>
              )
            }
          />
          <StatCard label="Income" value={formatIDR(totals.income)} icon={ArrowDownLeft} hint="Recorded this month" />
          <StatCard
            label="Net"
            value={
              <span className={cn(net > 0 && "text-positive", net < 0 && "text-negative")}>
                {net < 0 ? "−" : ""}
                {formatIDR(Math.abs(net))}
              </span>
            }
            icon={Scale}
            hint="Income minus expenses"
          />
        </section>

        {totals.count === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nothing recorded this month"
            description="Add a transaction manually. Email import for myBCA receipts arrives in the next update."
            action={<AddTransactionButton variant="secondary" />}
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Daily spending</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyChart month={month} data={daily} highlight={month === current ? todayKey(timezone, now) : undefined} />
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Where it went</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {breakdown.length > 0 ? (
                    <CategoryBreakdown items={breakdown} month={month} />
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">No expenses this month.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent</CardTitle>
                  <Link
                    href={`/finance/transactions?month=${month}`}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    View all
                  </Link>
                </CardHeader>
                <CardContent className="px-0 pb-2 pt-3">
                  <TransactionList rows={recent.rows} timezone={timezone} groupByDay={false} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </TransactionEditor>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-md bg-surface" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[118px] rounded-lg border bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-lg border bg-surface" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-lg border bg-surface" />
        <div className="h-72 rounded-lg border bg-surface" />
      </div>
    </div>
  );
}
