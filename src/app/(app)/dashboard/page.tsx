import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Beef, PiggyBank, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0];

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} description="Your month at a glance." />

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spent this month" value="—" hint="No transactions yet" icon={Wallet} />
        <StatCard label="Budget left" value="—" hint="Set a monthly budget" icon={PiggyBank} />
        <StatCard label="Protein today" value="0 g" hint="Set a daily target" icon={Beef} />
        <StatCard label="Sessions this week" value="0" hint="Lifts and runs" icon={Activity} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/finance/transactions" className="text-xs text-muted hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="Nothing here yet"
              description="Connect your Gmail to record myBCA receipts automatically."
              action={
                <Link href="/settings/integrations" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Set up email sync
                </Link>
              }
              className="border-0 py-10"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/fitness/history" className="text-xs text-muted hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="No sessions logged"
              description="Your lifts and runs will show up here."
              className="border-0 py-10"
            />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
