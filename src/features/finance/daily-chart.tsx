import { daysInMonth, formatDayHeading, type MonthKey } from "@/lib/dates";
import { formatIDR, formatIDRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

type DailyChartProps = {
  month: MonthKey;
  /** { "YYYY-MM-DD": amount } */
  data: Record<string, number>;
  /** Highlight this day, e.g. today. */
  highlight?: string;
};

/**
 * Server-rendered bar chart of daily spending. No client JS: bars are divs,
 * hover detail comes from title attributes, and screen readers get a table.
 */
export function DailyChart({ month, data, highlight }: DailyChartProps) {
  const n = daysInMonth(month);
  const days = Array.from({ length: n }, (_, i) => {
    const key = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { key, day: i + 1, amount: data[key] ?? 0 };
  });
  const max = Math.max(...days.map((d) => d.amount), 0);
  const ticks = new Set([1, 8, 15, 22, n]);

  return (
    <figure>
      <figcaption className="sr-only">Spending per day</figcaption>
      <div aria-hidden="true">
        <div className="mb-2 flex justify-between text-[11px] text-faint">
          <span className="tabular">{max > 0 ? formatIDRCompact(max) : ""}</span>
        </div>
        <div className="flex h-40 items-end gap-[3px] border-b">
          {days.map((d) => {
            const pct = max > 0 ? (d.amount / max) * 100 : 0;
            return (
              <div
                key={d.key}
                title={`${formatDayHeading(d.key)} · ${formatIDR(d.amount)}`}
                className="group flex h-full flex-1 items-end"
              >
                <div
                  style={{ height: d.amount > 0 ? `max(${pct}%, 3px)` : "2px" }}
                  className={cn(
                    "w-full rounded-t-[3px] transition-colors",
                    d.amount === 0
                      ? "bg-surface-2"
                      : d.key === highlight
                        ? "bg-accent"
                        : "bg-surface-3 group-hover:bg-faint",
                  )}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-[3px] text-[11px] text-faint">
          {days.map((d) => (
            <span key={d.key} className="tabular flex-1 text-center">
              {ticks.has(d.day) ? d.day : ""}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Spent</th>
          </tr>
        </thead>
        <tbody>
          {days
            .filter((d) => d.amount > 0)
            .map((d) => (
              <tr key={d.key}>
                <td>{formatDayHeading(d.key)}</td>
                <td>{formatIDR(d.amount)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}
