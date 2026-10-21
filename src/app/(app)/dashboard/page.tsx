import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Beef, PiggyBank, Wallet } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { RecentTransactions, SpendingStats } from "@/features/finance/dashboard-widgets";
import { ProteinTodayStat } from "@/features/nutrition/dashboard-widgets";
import { RecentActivity, SessionsThisWeekStat } from "@/features/strength/dashboard-widgets";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

/** Streams in the user's first name; the rest of the page renders immediately. */
async function Greeting() {
  const user = await requireUser();
  return <>Welcome back, {user.name.split(/\s+/)[0]}</>;
}

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

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/finance/transactions" className="text-xs text-muted hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-3">
            <Suspense fallback={<div aria-hidden="true" className="mx-5 h-64 animate-pulse rounded-md bg-surface-2/50" />}>
              <RecentTransactions />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/fitness/history" className="text-xs text-muted hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            <Suspense fallback={<div aria-hidden="true" className="h-48 animate-pulse rounded-md bg-surface-2/50" />}>
              <RecentActivity />
            </Suspense>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
