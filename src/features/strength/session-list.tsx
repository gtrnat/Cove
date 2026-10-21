import { ChevronRight, Dumbbell, Footprints } from "lucide-react";
import Link from "next/link";
import { formatKm, formatPace, paceSecondsPerKm, runTypeLabels, type RunType } from "@/features/running/format";
import { formatDateTime } from "@/lib/dates";
import { formatDuration, formatVolume } from "./metrics";
import type { SessionSummary } from "./queries";

/** History rows for both lifts and runs. */
export function SessionList({ sessions, timezone }: { sessions: SessionSummary[]; timezone: string }) {
  return (
    <ul className="divide-y rounded-lg border bg-surface">
      {sessions.map((s) => {
        const isRun = s.type === "run";
        const names = [...s.exerciseNames].sort();
        const detail = isRun
          ? s.runType
            ? runTypeLabels[s.runType as RunType]
            : ""
          : names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "");
        const Icon = isRun ? Footprints : Dumbbell;
        return (
          <li key={s.id}>
            <Link
              href={`/fitness/history/${s.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-surface-2"
            >
              <span
                aria-hidden="true"
                className={
                  isRun
                    ? "grid size-9 shrink-0 place-items-center rounded-full bg-positive/10 text-positive"
                    : "grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"
                }
              >
                <Icon strokeWidth={1.75} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{s.title}</span>
                <span className="block truncate text-xs text-muted">
                  {formatDateTime(s.startedAt, timezone)} · {formatDuration(s.durationS)}
                </span>
                {detail && <span className="mt-0.5 block truncate text-xs text-faint">{detail}</span>}
              </span>
              <span className="shrink-0 text-right">
                {isRun && s.distanceM ? (
                  <>
                    <span className="tabular block text-sm">{formatKm(s.distanceM)} km</span>
                    <span className="tabular block text-xs text-muted">
                      {s.durationS ? `${formatPace(paceSecondsPerKm(s.durationS, s.distanceM))} /km` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="tabular block text-sm">{formatVolume(s.volume)} kg</span>
                    <span className="block text-xs text-muted">
                      {s.setCount} {s.setCount === 1 ? "set" : "sets"}
                    </span>
                  </>
                )}
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-faint" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
