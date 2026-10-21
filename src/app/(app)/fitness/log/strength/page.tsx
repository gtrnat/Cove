import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getFitnessContext } from "@/features/strength/context";
import { listExercises, getSessionDetail, lastSetsFor } from "@/features/strength/queries";
import { WorkoutLogger, type WorkoutLoggerProps } from "@/features/strength/workout-logger";
import { toLocalDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Log workout" };

export default function LogStrengthPage(props: PageProps<"/fitness/log/strength">) {
  return (
    <Suspense fallback={<LoggerSkeleton />}>
      <Logger searchParams={props.searchParams} />
    </Suspense>
  );
}

function defaultTitle(date: Date, timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date));
  if (hour < 11) return "Morning workout";
  if (hour < 15) return "Midday workout";
  if (hour < 18) return "Afternoon workout";
  return "Evening workout";
}

async function Logger({ searchParams }: Pick<PageProps<"/fitness/log/strength">, "searchParams">) {
  const [{ user, timezone }, params] = await Promise.all([getFitnessContext(), searchParams]);
  await connection(); // defaults depend on the current time
  const editId = typeof params.edit === "string" ? params.edit : undefined;
  const library = await listExercises(user.id);

  let initial: WorkoutLoggerProps["initial"];
  if (editId) {
    const detail = /^[0-9a-f-]{36}$/i.test(editId) ? await getSessionDetail(user.id, editId) : null;
    if (!detail || detail.session.type !== "strength") notFound();
    const { session } = detail;
    initial = {
      id: session.id,
      title: session.title,
      startedAt: toLocalDateTime(session.startedAt, timezone),
      durationMin: session.durationS ? String(Math.round(session.durationS / 60)) : "",
      notes: session.notes ?? "",
      exercises: detail.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, isWarmup: s.isWarmup })),
      })),
    };
  } else {
    const now = new Date();
    initial = {
      title: defaultTitle(now, timezone),
      startedAt: toLocalDateTime(now, timezone),
      durationMin: "",
      notes: "",
      exercises: [],
    };
  }

  const previous = await lastSetsFor(
    user.id,
    initial.exercises.map((e) => e.exerciseId),
    editId,
  );

  return (
    <WorkoutLogger
      key={editId ?? "new"}
      userId={user.id}
      exercises={library}
      initial={initial}
      previous={previous}
    />
  );
}

function LoggerSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-28 rounded-lg border bg-surface" />
      <div className="h-56 rounded-lg border bg-surface" />
    </div>
  );
}
