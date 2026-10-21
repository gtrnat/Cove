import { formatDayHeading } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { formatVolume } from "./metrics";

/** Server-rendered bars of weekly training volume; current week highlighted. */
export function WeeklyVolumeChart({ weeks }: { weeks: { week: string; sessions: number; volume: number }[] }) {
  const max = Math.max(...weeks.map((w) => w.volume), 0);
  const label = (key: string) => formatDayHeading(key).replace(/^\w+, /, "");

  return (
    <figure>
      <figcaption className="sr-only">Training volume per week</figcaption>
      <div aria-hidden="true">
        <div className="flex h-36 items-end gap-2 border-b">
          {weeks.map((w, i) => (
            <div key={w.week} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${label(w.week)} · ${formatVolume(w.volume)} kg · ${w.sessions} sessions`}>
              <div
                style={{ height: w.volume > 0 ? `max(${(w.volume / max) * 100}%, 3px)` : "2px" }}
                className={cn(
                  "w-full rounded-t-[3px]",
                  w.volume === 0 ? "bg-surface-2" : i === weeks.length - 1 ? "bg-accent" : "bg-surface-3",
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2 text-[11px] text-faint">
          {weeks.map((w, i) => (
            <span key={w.week} className="flex-1 text-center">
              {i === 0 || i === weeks.length - 1 || i === Math.floor(weeks.length / 2) ? label(w.week) : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Volume</th>
            <th scope="col">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}>
              <td>{label(w.week)}</td>
              <td>{formatVolume(w.volume)} kg</td>
              <td>{w.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
