import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt, Scale } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = { title: "Finance" };

export default function FinanceOverviewPage() {
  return (
    <div className="space-y-6">
      <section aria-label="This month" className="grid gap-4 md:grid-cols-3">
        <StatCard label="Expenses" value="Rp 0" hint="This month" icon={ArrowUpRight} />
        <StatCard label="Income" value="Rp 0" hint="This month" icon={ArrowDownLeft} />
        <StatCard label="Net" value="Rp 0" hint="Income minus expenses" icon={Scale} />
      </section>

      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Add one manually or connect Gmail so myBCA receipts are recorded for you."
        action={
          <Link href="/settings/integrations" className={buttonVariants({ variant: "secondary" })}>
            Connect Gmail
          </Link>
        }
      />
    </div>
  );
}
