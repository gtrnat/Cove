import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Activity, Dumbbell, Flame, Footprints, Scale } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getFitnessContext } from "@/features/strength/context";
import { formatVolume } from "@/features/strength/metrics";
import { getTrainingSummary } from "@/features/strength/overview";
import { listSessions } from "@/features/strength/queries";
import { SessionList } from "@/features/strength/session-list";
import { WeeklyVolumeChart } from "@/features/strength/weekly-volume-chart";

export const metadata: Metadata = { title: "Fitness" };

export default function FitnessOverviewPage() {
  return (
    <div className="space-y-6">
      <section aria-label="This week" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense
          fallback={
            <>
              <StatCard label="Week streak" value="…" icon={Flame} />
              <StatCard label="Volume this week" value="…" icon={Dumbbell} />
            </>
          }
        >
          <TrainingStats />
        </Suspense>
        <StatCard label="Distance this week" value="0 km" hint="Run logging is next" icon={Footprints} />
        <StatCard label="Body weight" value="—" hint="Weight logging comes with nutrition" icon={Scale} />
      </section>

      <Suspense fallback={<div aria-hidden="true" className="h-72 animate-pulse rounded-lg border bg-surface" />}>
        <TrainingDetail />
      </Suspense>
    </div>
  );
}

async function TrainingStats() {
  const { thisWeek, streak } = await getTrainingSummary();
  return (
    <>
      <StatCard
        label="Week streak"
        value={`${streak} ${streak === 1 ? "week" : "weeks"}`}
        hint="Weeks in a row with a session"
        icon={Flame}
      />
      <StatCard
        label="Volume this week"
        value={`${formatVolume(thisWeek.volume)} kg`}
        hint={`${thisWeek.sessions} ${thisWeek.sessions === 1 ? "session" : "sessions"} · weight × reps`}
        icon={Dumbbell}
      />
    </>
  );
}

async function TrainingDetail() {
  const { user, timezone } = await getFitnessContext();
  const [{ weeks }, recent] = await Promise.all([getTrainingSummary(), listSessions(user.id, { limit: 5 })]);

  if (recent.total === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Start your first session"
        description="Log a workout and your weekly volume, streak, and personal records appear here."
        action={
          <Link href="/fitness/log/strength" className={buttonVariants()}>
            <Dumbbell aria-hidden="true" />
            Log workout
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Volume per week</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyVolumeChart weeks={weeks} />
        </CardContent>
      </Card>
      <section aria-labelledby="recent-sessions">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="recent-sessions" className="text-sm font-medium">
            Recent sessions
          </h2>
          <Link href="/fitness/history" className="text-xs text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        <SessionList sessions={recent.rows} timezone={timezone} />
      </section>
    </div>
  );
}
