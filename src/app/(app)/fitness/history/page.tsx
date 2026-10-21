import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFitnessContext } from "@/features/strength/context";
import { listSessions } from "@/features/strength/queries";
import { SessionList } from "@/features/strength/session-list";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage(props: PageProps<"/fitness/history">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
      <HistoryList searchParams={props.searchParams} />
    </Suspense>
  );
}

async function HistoryList({ searchParams }: Pick<PageProps<"/fitness/history">, "searchParams">) {
  const [{ user, timezone }, params] = await Promise.all([getFitnessContext(), searchParams]);
  const pageNum = Math.max(1, Math.min(1000, Number(params.page) || 1));
  const { rows, total, page, pageCount } = await listSessions(user.id, { page: pageNum });

  if (total === 0) {
    return (
      <EmptyState
        icon={History}
        title="No sessions yet"
        description="Every workout you log shows up here, newest first."
        action={
          <Link href="/fitness/log/strength" className={buttonVariants({ variant: "secondary" })}>
            Log a workout
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        {total} {total === 1 ? "session" : "sessions"}
      </p>
      <SessionList sessions={rows} timezone={timezone} />
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/fitness/history?page=${page - 1}`} className="inline-flex items-center gap-1 text-muted hover:text-foreground">
              <ChevronLeft aria-hidden="true" className="size-4" /> Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="tabular text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={`/fitness/history?page=${page + 1}`} className="inline-flex items-center gap-1 text-muted hover:text-foreground">
              Older <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
