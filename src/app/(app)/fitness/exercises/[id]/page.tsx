import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Trophy } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getFitnessContext } from "@/features/strength/context";
import { equipmentLabels, muscleLabels, type Equipment, type MuscleGroup } from "@/features/strength/labels";
import { formatE1RM, formatVolume, formatWeight } from "@/features/strength/metrics";
import { exerciseHistory, getExercise } from "@/features/strength/queries";
import { formatShortDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Exercise progress" };

export default function ExercisePage(props: PageProps<"/fitness/exercises/[id]">) {
  return (
    <>
      <Link href="/fitness/exercises" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft aria-hidden="true" className="size-4" />
        Exercises
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
        <Progress params={props.params} />
      </Suspense>
    </>
  );
}

async function Progress({ params }: Pick<PageProps<"/fitness/exercises/[id]">, "params">) {
  const [{ user, timezone }, { id }] = await Promise.all([getFitnessContext(), params]);
  const exercise = /^[0-9a-f-]{36}$/i.test(id) ? await getExercise(user.id, id) : null;
  if (!exercise) notFound();
  const { sessions, records } = await exerciseHistory(user.id, exercise.id);
  const date = (d: Date) => formatShortDate(d, timezone);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em]">{exercise.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {muscleLabels[exercise.muscleGroup as MuscleGroup]} · {equipmentLabels[exercise.equipment as Equipment]}
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={Trophy} title="Not trained yet" description="Add this exercise to a workout to start tracking it." />
      ) : (
        <>
          <section aria-label="Personal records" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Best est. 1RM"
              value={`${formatE1RM(records.e1rm!.bestE1RM)} kg`}
              hint={date(records.e1rm!.startedAt)}
              icon={Trophy}
            />
            <StatCard
              label="Heaviest set"
              value={`${formatWeight(records.heaviest!.topWeight)} kg`}
              hint={`× ${records.heaviest!.topReps} · ${date(records.heaviest!.startedAt)}`}
            />
            <StatCard
              label="Best session volume"
              value={`${formatVolume(records.volume!.volume)} kg`}
              hint={date(records.volume!.startedAt)}
            />
            <StatCard
              label="Most reps"
              value={records.mostReps!.reps}
              hint={`at ${formatWeight(records.mostReps!.weightKg)} kg · ${date(records.mostReps!.startedAt)}`}
            />
          </section>

          {sessions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Estimated 1RM</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart
                  caption={`Estimated one-rep max for ${exercise.name} per session`}
                  valueLabel="Estimated 1RM"
                  format={(v) => `${formatE1RM(v)} kg`}
                  points={sessions.slice(-30).map((s) => ({ label: date(s.startedAt), value: s.bestE1RM }))}
                />
              </CardContent>
            </Card>
          )}

          <section aria-labelledby="ex-history">
            <h3 id="ex-history" className="mb-3 text-[15px] font-medium">
              History
            </h3>
            <ul className="divide-y rounded-lg border bg-surface">
              {[...sessions].reverse().map((s) => (
                <li key={s.sessionId}>
                  <Link
                    href={`/fitness/history/${s.sessionId}`}
                    className="flex items-start justify-between gap-4 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm">{date(s.startedAt)}</span>
                      <span className="tabular block text-xs text-muted">
                        {s.sets.map((x) => `${formatWeight(x.weightKg)}×${x.reps}`).join("  ")}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-right text-xs text-muted">
                      <span className="block text-sm text-foreground">{formatE1RM(s.bestE1RM)} kg</span>
                      est. 1RM
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
