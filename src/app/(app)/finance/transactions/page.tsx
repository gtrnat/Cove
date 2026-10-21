import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Receipt, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getFinanceContext } from "@/features/finance/context";
import { FilterBar } from "@/features/finance/filter-bar";
import { resolveMonth } from "@/features/finance/month-param";
import { MonthSwitcher } from "@/features/finance/month-switcher";
import { getMonthTotals, listTransactions } from "@/features/finance/queries";
import { transactionFiltersSchema } from "@/features/finance/schemas";
import { AddTransactionButton, TransactionEditor } from "@/features/finance/transaction-editor";
import { TransactionList } from "@/features/finance/transaction-list";
import { formatIDR } from "@/lib/format";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage(props: PageProps<"/finance/transactions">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Transactions searchParams={props.searchParams} />
    </Suspense>
  );
}

type SearchParams = Awaited<PageProps<"/finance/transactions">["searchParams"]>;

function first(v: SearchParams[string]) {
  return Array.isArray(v) ? v[0] : v;
}

async function Transactions({ searchParams }: Pick<PageProps<"/finance/transactions">, "searchParams">) {
  const [{ user, timezone, categoryChoices }, params] = await Promise.all([getFinanceContext(), searchParams]);
  await connection();
  const { month, current } = resolveMonth(params.month, timezone, new Date());
  const filters = transactionFiltersSchema.parse({
    type: first(params.type),
    category: first(params.category),
    source: first(params.source),
    q: first(params.q) || undefined,
    page: first(params.page),
  });

  const [list, totals] = await Promise.all([
    listTransactions(user.id, timezone, { month, filters }),
    getMonthTotals(user.id, timezone, month),
  ]);
  const filtered = Boolean(filters.type || filters.category || filters.source || filters.q);

  // Keep every current param except the ones being replaced.
  const hrefWith = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      const value = first(v);
      if (value && k !== "new") sp.set(k, value);
    }
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const qs = sp.toString();
    return qs ? `/finance/transactions?${qs}` : "/finance/transactions";
  };

  return (
    <TransactionEditor categories={categoryChoices} timezone={timezone} autoOpen={first(params.new) === "1"}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <MonthSwitcher
            month={month}
            current={current}
            hrefFor={(m) => hrefWith({ month: m === current ? null : m, page: null })}
          />
          <p className="tabular text-sm text-muted">
            {formatIDR(totals.expense)} out · {formatIDR(totals.income)} in
          </p>
        </div>

        <FilterBar categories={categoryChoices} />

        {list.rows.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description="No transactions this month match these filters."
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No transactions this month"
              description="Add one manually, or connect Gmail in Settings → Integrations to import myBCA receipts."
              action={<AddTransactionButton variant="secondary" />}
            />
          )
        ) : (
          <>
            <p className="text-xs text-muted" aria-live="polite">
              {list.total} {list.total === 1 ? "transaction" : "transactions"}
            </p>
            <TransactionList rows={list.rows} timezone={timezone} />
            {list.pageCount > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between pt-2 text-sm">
                {list.page > 1 ? (
                  <Link href={hrefWith({ page: String(list.page - 1) })} className="inline-flex items-center gap-1 text-muted hover:text-foreground">
                    <ChevronLeft aria-hidden="true" className="size-4" /> Newer
                  </Link>
                ) : (
                  <span />
                )}
                <span className="tabular text-muted">
                  Page {list.page} of {list.pageCount}
                </span>
                {list.page < list.pageCount ? (
                  <Link href={hrefWith({ page: String(list.page + 1) })} className="inline-flex items-center gap-1 text-muted hover:text-foreground">
                    Older <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </TransactionEditor>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-md bg-surface" />
      <div className="flex gap-3">
        <div className="h-10 w-64 rounded-md bg-surface" />
        <div className="h-10 w-36 rounded-md bg-surface" />
        <div className="h-10 w-48 rounded-md bg-surface" />
      </div>
      {[0, 1].map((g) => (
        <div key={g} className="space-y-2">
          <div className="h-3 w-24 rounded bg-surface" />
          <div className="h-48 rounded-lg border bg-surface" />
        </div>
      ))}
    </div>
  );
}
