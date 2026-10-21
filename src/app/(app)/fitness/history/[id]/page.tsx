import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { getFitnessContext } from "@/features/strength/context";
import { DeleteWorkoutButton } from "@/features/strength/delete-workout-button";
import { muscleLabels, type MuscleGroup } from "@/features/strength/labels";
import { estimate1RM, formatDuration, formatE1RM, formatVolume, formatWeight } from "@/features/strength/metrics";
import { getSessionDetail } from "@/features/strength/queries";
import {
  formatClock,
  formatKm,
  formatPace,
  paceSecondsPerKm,
  runTypeLabels,
  surfaceLabels,
} from "@/features/running/format";
import { getRun, type RunRow } from "@/features/running/queries";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Workout" };

export default function SessionPage(props: PageProps<"/fitness/history/[id]">) {
  return (
    <>
      <Link href="/fitness/history" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft aria-hidden="true" className="size-4" />
        History
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
        <SessionDetail params={props.params} />
      </Suspense>
    </>
  );
}

async function SessionDetail({ params }: Pick<PageProps<"/fitness/history/[id]">, "params">) {
  const [{ user, timezone }, { id }] = await Promise.all([getFitnessContext(), params]);
  const detail = /^[0-9a-f-]{36}$/i.test(id) ? await getSessionDetail(user.id, id) : null;
  if (!detail) notFound();
  if (detail.session.type === "run") {
    const run = await getRun(user.id, detail.session.id);
    if (!run) notFound();
    return <RunDetail run={run} timezone={timezone} />;
  }
  const { session, exercises } = detail;

  const working = exercises.flatMap((e) => e.sets.filter((s) => !s.isWarmup));
  const volume = working.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.01em]">{session.title}</h2>
          <p className="mt-1 text-sm text-muted">{formatDateTime(session.startedAt, timezone)}</p>
        </div>
        <div className="flex gap-1">
          {session.type === "strength" && (
            <Link href={`/fitness/log/strength?edit=${session.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          )}
          <DeleteWorkoutButton id={session.id} />
        </div>
      </div>

      <section aria-label="Summary" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Duration" value={formatDuration(session.durationS)} />
        <StatCard label="Volume" value={`${formatVolume(volume)} kg`} />
        <StatCard label="Working sets" value={working.length} />
        <StatCard label="Exercises" value={exercises.length} />
      </section>

      {exercises.map((ex, i) => {
        const best = ex.sets
          .filter((s) => !s.isWarmup)
          .reduce((b, s) => Math.max(b, estimate1RM(s.weightKg, s.reps)), 0);
        let n = 0;
        return (
          <section key={`${ex.exerciseId}-${i}`} aria-labelledby={`sx-${i}`} className="rounded-lg border bg-surface">
            <div className="flex items-baseline justify-between gap-3 p-4 pb-2">
              <div>
                <h3 id={`sx-${i}`} className="text-[15px] font-medium">
                  <Link href={`/fitness/exercises/${ex.exerciseId}`} className="hover:underline hover:underline-offset-4">
                    {ex.name}
                  </Link>
                </h3>
                <p className="text-xs text-muted">{muscleLabels[ex.muscleGroup as MuscleGroup]}</p>
              </div>
              {best > 0 && <p className="tabular text-xs text-muted">est. 1RM {formatE1RM(best)} kg</p>}
            </div>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Set</th>
                  <th scope="col">Weight and reps</th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((s, j) => (
                  <tr key={j} className="border-t">
                    <td className="tabular w-12 py-2 pl-4 text-xs text-muted">{s.isWarmup ? "W" : ++n}</td>
                    <td className="tabular py-2 pr-4">
                      {formatWeight(s.weightKg)} kg × {s.reps}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      {session.notes && (
        <section aria-labelledby="notes" className="rounded-lg border bg-surface p-4">
          <h3 id="notes" className="text-xs font-medium uppercase tracking-wider text-muted">
            Notes
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{session.notes}</p>
        </section>
      )}
    </div>
  );
}

function RunDetail({ run, timezone }: { run: RunRow; timezone: string }) {
  const pace = run.durationS ? paceSecondsPerKm(run.durationS, run.distanceM) : 0;
  const extras = [
    ["Avg heart rate", run.avgHr, "bpm"],
    ["Max heart rate", run.maxHr, "bpm"],
    ["Elevation gain", run.elevationGainM, "m"],
    ["Cadence", run.cadence, "spm"],
  ].filter(([, v]) => v !== null) as [string, number, string][];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.01em]">{run.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatDateTime(run.startedAt, timezone)} · {runTypeLabels[run.runType]} · {surfaceLabels[run.surface]}
          </p>
        </div>
        <div className="flex gap-1">
          <Link href={`/fitness/log/run?edit=${run.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Pencil aria-hidden="true" />
            Edit
          </Link>
          <DeleteWorkoutButton id={run.id} />
        </div>
      </div>

      <section aria-label="Summary" className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Distance" value={`${formatKm(run.distanceM)} km`} />
        <StatCard label="Time" value={run.durationS ? formatClock(run.durationS) : "—"} />
        <StatCard label="Pace" value={`${formatPace(pace)} /km`} />
      </section>

      {extras.length > 0 && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-4">
          {extras.map(([label, value, unit]) => (
            <div key={label} className="bg-surface p-4">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="tabular mt-1 text-lg">
                {value} <span className="text-sm text-muted">{unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {run.notes && (
        <section aria-labelledby="run-notes" className="rounded-lg border bg-surface p-4">
          <h3 id="run-notes" className="text-xs font-medium uppercase tracking-wider text-muted">
            Notes
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{run.notes}</p>
        </section>
      )}
    </div>
  );
}
