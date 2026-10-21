import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Beef, Dumbbell, Footprints, PiggyBank, Plus, Utensils, Wallet } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { BudgetWatch, RecentTransactions, SpendingStats } from "@/features/finance/dashboard-widgets";
import { ProteinTodayStat } from "@/features/nutrition/dashboard-widgets";
import { RecentActivity, SessionsThisWeekStat } from "@/features/strength/dashboard-widgets";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

/** Streams in the user's first name; the rest of the page renders immediately. */
async function Greeting() {
  const user = await requireUser();
  return <>Welcome back, {user.name.split(/\s+/)[0]}</>;
}

const quickActions = [
  { href: "/finance/transactions?new=1", label: "Add transaction", icon: Plus },
  { href: "/fitness/nutrition?add=1", label: "Log food", icon: Utensils },
  { href: "/fitness/log/strength", label: "Log workout", icon: Dumbbell },
  { href: "/fitness/log/run", label: "Log run", icon: Footprints },
];

const skeleton = (h: string) => <div aria-hidden="true" className={`${h} animate-pulse rounded-md bg-surface-2/50`} />;

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title={
          <Suspense fallback="Welcome back">
            <Greeting />
          </Suspense>
        }
        description="Your month at a glance."
      />

      <nav aria-label="Quick add" className="-mt-2 mb-6 flex gap-2 overflow-x-auto pb-1">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm text-muted transition-colors hover:border-faint hover:text-foreground"
          >
            <Icon aria-hidden="true" className="size-4 text-accent" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense
          fallback={
            <>
              <StatCard label="Spent this month" value="…" icon={Wallet} />
              <StatCard label="Budget left" value="…" icon={PiggyBank} />
            </>
          }
        >
          <SpendingStats />
        </Suspense>
        <Suspense fallback={<StatCard label="Protein today" value="…" icon={Beef} />}>
          <ProteinTodayStat />
        </Suspense>
        <Suspense fallback={<StatCard label="Sessions this week" value="…" icon={Activity} />}>
          <SessionsThisWeekStat />
        </Suspense>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/finance/transactions" className="text-xs text-muted hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-3">
            <Suspense fallback={<div className="mx-5">{skeleton("h-64")}</div>}>
              <RecentTransactions />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget watch</CardTitle>
            <Link href="/finance/budgets" className="text-xs text-muted hover:text-foreground">
              Budgets
            </Link>
          </CardHeader>
          <CardContent>
            <Suspense fallback={skeleton("h-48")}>
              <BudgetWatch />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/fitness/history" className="text-xs text-muted hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            <Suspense fallback={skeleton("h-48")}>
              <RecentActivity />
            </Suspense>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
