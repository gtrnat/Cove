import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatMonth, shiftMonth, type MonthKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

type MonthSwitcherProps = {
  month: MonthKey;
  current: MonthKey;
  /** Builds the href for a given month, keeping other query params. */
  hrefFor: (month: MonthKey) => string;
};

export function MonthSwitcher({ month, current, hrefFor }: MonthSwitcherProps) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const isFuture = next > current;
  const btn =
    "grid size-8 place-items-center rounded-md border border-border-strong text-muted transition-colors hover:bg-surface-2 hover:text-foreground";

  return (
    <nav aria-label="Month" className="flex items-center gap-2">
      <Link href={hrefFor(prev)} className={btn} aria-label={`Previous month, ${formatMonth(prev)}`}>
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Link>
      <p className="min-w-32 text-center text-sm font-medium" aria-live="polite">
        {formatMonth(month)}
      </p>
      {isFuture ? (
        <span className={cn(btn, "pointer-events-none opacity-40")} aria-hidden="true">
          <ChevronRight className="size-4" />
        </span>
      ) : (
        <Link href={hrefFor(next)} className={btn} aria-label={`Next month, ${formatMonth(next)}`}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      )}
      {month !== current && (
        <Link href={hrefFor(current)} className="ml-1 text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
          This month
        </Link>
      )}
    </nav>
  );
}
