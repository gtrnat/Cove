import { formatDayHeading } from "@/lib/dates";
import { cn } from "@/lib/utils";

type WeeklyBarChartProps = {
  /** `week` is the Monday as "YYYY-MM-DD"; the last item is the current week. */
  weeks: { week: string; value: number }[];
  format: (value: number) => string;
  caption: string;
  valueLabel: string;
};

/** Server-rendered weekly bars; the current week is highlighted. */
export function WeeklyBarChart({ weeks, format, caption, valueLabel }: WeeklyBarChartProps) {
  const max = Math.max(...weeks.map((w) => w.value), 0);
  const label = (key: string) => formatDayHeading(key).replace(/^\w+, /, "");
  const ticks = new Set([0, Math.floor(weeks.length / 2), weeks.length - 1]);

  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <div aria-hidden="true">
        <div className="flex h-36 items-end gap-2 border-b">
          {weeks.map((w, i) => (
            <div key={w.week} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${label(w.week)} · ${format(w.value)}`}>
              <div
                style={{ height: w.value > 0 ? `max(${(w.value / max) * 100}%, 3px)` : "2px" }}
                className={cn(
                  "w-full rounded-t-[3px]",
                  w.value === 0 ? "bg-surface-2" : i === weeks.length - 1 ? "bg-accent" : "bg-surface-3",
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2 text-[11px] text-faint">
          {weeks.map((w, i) => (
            <span key={w.week} className="flex-1 text-center">
              {ticks.has(i) ? label(w.week) : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}>
              <td>{label(w.week)}</td>
              <td>{format(w.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
