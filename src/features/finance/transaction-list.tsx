import { Mail } from "lucide-react";
import { formatDayHeading, formatTime } from "@/lib/dates";
import { formatIDR, formatSignedIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-badge";
import type { TransactionRow } from "./queries";
import { EditTransactionTrigger } from "./transaction-editor";

type TransactionListProps = {
  rows: TransactionRow[];
  timezone: string;
  /** Show a day heading with that day's spending above each group. */
  groupByDay?: boolean;
};

/** Must be rendered inside <TransactionEditor>. */
export function TransactionList({ rows, timezone, groupByDay = true }: TransactionListProps) {
  if (!groupByDay) {
    return (
      <ul className="divide-y">
        {rows.map((row) => (
          <Row key={row.id} row={row} timezone={timezone} showDate />
        ))}
      </ul>
    );
  }

  const groups = new Map<string, TransactionRow[]>();
  for (const row of rows) {
    const list = groups.get(row.day) ?? [];
    list.push(row);
    groups.set(row.day, list);
  }

  return (
    <div className="space-y-6">
      {[...groups].map(([day, items]) => {
        const spent = items.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
        return (
          <section key={day} aria-labelledby={`day-${day}`}>
            <div className="mb-1 flex items-baseline justify-between px-1">
              <h3 id={`day-${day}`} className="text-xs font-medium uppercase tracking-wider text-muted">
                {formatDayHeading(day)}
              </h3>
              {spent > 0 && <p className="tabular text-xs text-muted">{formatIDR(spent)}</p>}
            </div>
            <ul className="divide-y rounded-lg border bg-surface">
              {items.map((row) => (
                <Row key={row.id} row={row} timezone={timezone} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Row({ row, timezone, showDate }: { row: TransactionRow; timezone: string; showDate?: boolean }) {
  const time = formatTime(row.occurredAt, timezone);
  const meta = [row.categoryName ?? "Uncategorized", showDate ? `${formatDayHeading(row.day)}, ${time}` : time];

  return (
    <li>
      <EditTransactionTrigger
        transaction={{
          id: row.id,
          type: row.type,
          amount: row.amount,
          merchant: row.merchant,
          description: row.description,
          categoryId: row.categoryId,
          occurredAt: row.occurredAt,
          source: row.source,
        }}
        label={`Edit ${row.merchant}, ${formatSignedIDR(row.amount, row.type)}, ${meta.join(", ")}${row.source === "email" ? ", imported from email" : ""}`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-surface-2 focus-visible:-outline-offset-2"
      >
        <CategoryIcon icon={row.categoryIcon} color={row.categoryColor} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground">{row.merchant}</span>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted">
            {meta.join(" · ")}
            {row.source === "email" && (
              <Mail aria-hidden="true" className="size-3 shrink-0 text-faint" />
            )}
          </span>
        </span>
        <span
          className={cn(
            "tabular shrink-0 text-sm",
            row.type === "income" ? "text-positive" : "text-foreground",
          )}
        >
          {formatSignedIDR(row.amount, row.type)}
        </span>
      </EditTransactionTrigger>
    </li>
  );
}
