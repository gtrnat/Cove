import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getFitnessContext } from "@/features/strength/context";
import { muscleLabels, type MuscleGroup } from "@/features/strength/labels";
import { formatE1RM } from "@/features/strength/metrics";
import { performedExercises } from "@/features/strength/queries";
import { formatShortDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
      <Exercises />
    </Suspense>
  );
}

async function Exercises() {
  const { user, timezone } = await getFitnessContext();
  const rows = await performedExercises(user.id);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No progress to show yet"
        description="Log a workout and each exercise gets its own page with estimated 1RM, volume, and personal records."
      />
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-surface">
      {rows.map((r) => (
        <li key={r.id}>
          <Link
            href={`/fitness/exercises/${r.id}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{r.name}</span>
              <span className="block text-xs text-muted">
                {muscleLabels[r.muscleGroup as MuscleGroup]} · {r.sessions} {r.sessions === 1 ? "session" : "sessions"}
                {r.lastAt ? ` · last ${formatShortDate(r.lastAt, timezone)}` : ""}
              </span>
            </span>
            {r.bestE1RM > 0 && (
              <span className="shrink-0 text-right">
                <span className="tabular block text-sm">{formatE1RM(r.bestE1RM)} kg</span>
                <span className="block text-xs text-muted">best est. 1RM</span>
              </span>
            )}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-faint" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
