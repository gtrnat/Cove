import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Footprints, Gauge, Route, Trophy } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { WeeklyBarChart } from "@/components/charts/weekly-bar-chart";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatClock, formatKm, formatPace, paceSecondsPerKm } from "@/features/running/format";
import { allRuns, runRecords } from "@/features/running/queries";
import { getFitnessContext } from "@/features/strength/context";
import { getTrainingSummary } from "@/features/strength/overview";
import { listSessions } from "@/features/strength/queries";
import { SessionList } from "@/features/strength/session-list";
import { currentMonth, formatShortDate, toLocalDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Running" };

export default function RunningPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
      <Running />
    </Suspense>
  );
}

async function Running() {
  const { user, timezone } = await getFitnessContext();
  const [runs, summary, recent] = await Promise.all([
    allRuns(user.id),
    getTrainingSummary(12),
    listSessions(user.id, { type: "run", limit: 5 }),
  ]);

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={Footprints}
        title="No runs yet"
        description="Log a run and you'll see weekly distance, your pace trend, and best efforts for 1K, 5K, and 10K."
        action={
          <Link href="/fitness/log/run" className={buttonVariants()}>
            <Footprints aria-hidden="true" />
            Log run
          </Link>
        }
      />
    );
  }

  const month = currentMonth(timezone);
  const monthM = runs
    .filter((r) => toLocalDateTime(r.startedAt, timezone).slice(0, 7) === month)
    .reduce((sum, r) => sum + r.distanceM, 0);
  const totalM = runs.reduce((sum, r) => sum + r.distanceM, 0);

  // Average pace over the last 30 days, weighted by distance.
  const since = summary.weeks.at(-5)?.week ?? "";
  const recentTimed = runs.filter((r) => r.durationS && toLocalDateTime(r.startedAt, timezone).slice(0, 10) >= since);
  const avgPace = recentTimed.length
    ? paceSecondsPerKm(
        recentTimed.reduce((s, r) => s + r.durationS!, 0),
        recentTimed.reduce((s, r) => s + r.distanceM, 0),
      )
    : 0;

  const { thisWeek, lastWeek } = summary;
  const delta = thisWeek.distanceM - lastWeek.distanceM;
  const records = runRecords(runs);
  const trend = runs
    .filter((r) => r.durationS && r.distanceM >= 1000)
    .slice(-20)
    .map((r) => ({ label: formatShortDate(r.startedAt, timezone), value: paceSecondsPerKm(r.durationS!, r.distanceM) }));
  const date = (d: Date) => formatShortDate(d, timezone);

  const efforts = [
    ["1K", records.k1],
    ["5K", records.k5],
    ["10K", records.k10],
    ["Half marathon", records.half],
  ] as const;

  return (
    <div className="space-y-6">
      <section aria-label="Totals" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="This week"
          value={`${formatKm(thisWeek.distanceM, 1)} km`}
          hint={lastWeek.distanceM ? `${delta >= 0 ? "+" : "−"}${formatKm(Math.abs(delta), 1)} km vs last week` : `${thisWeek.runs} ${thisWeek.runs === 1 ? "run" : "runs"}`}
          icon={Footprints}
        />
        <StatCard label="This month" value={`${formatKm(monthM, 1)} km`} icon={CalendarDays} />
        <StatCard label="Avg pace" value={`${formatPace(avgPace)} /km`} hint="Last 4 weeks" icon={Gauge} />
        <StatCard
          label="All time"
          value={`${formatKm(totalM, 0)} km`}
          hint={`${runs.length} ${runs.length === 1 ? "run" : "runs"}`}
          icon={Route}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distance per week</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyBarChart
              weeks={summary.weeks.map((w) => ({ week: w.week, value: w.distanceM }))}
              format={(v) => `${formatKm(v, 1)} km`}
              caption="Running distance per week"
              valueLabel="Distance"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pace trend</CardTitle>
            <span className="text-xs text-muted">Lower is faster</span>
          </CardHeader>
          <CardContent>
            {trend.length > 1 ? (
              <LineChart
                points={trend}
                format={(v) => `${formatPace(v)} /km`}
                caption="Average pace per run, most recent 20 runs"
                valueLabel="Pace"
              />
            ) : (
              <p className="py-12 text-center text-sm text-muted">Log another run to see your trend.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="best-efforts">
        <h2 id="best-efforts" className="mb-3 flex items-center gap-2 text-[15px] font-medium">
          <Trophy aria-hidden="true" className="size-4 text-accent" strokeWidth={1.75} />
          Best efforts
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {efforts.map(([label, effort]) => (
            <StatCard
              key={label}
              label={label}
              value={effort ? formatClock(effort.seconds) : "—"}
              hint={
                effort
                  ? effort.run.distanceM > (label === "1K" ? 1000 : label === "5K" ? 5000 : label === "10K" ? 10000 : 21097)
                    ? `from a ${formatKm(effort.run.distanceM, 1)} km run · ${date(effort.run.startedAt)}`
                    : date(effort.run.startedAt)
                  : "No run this long yet"
              }
            />
          ))}
          <StatCard
            label="Longest run"
            value={records.longest ? `${formatKm(records.longest.distanceM, 1)} km` : "—"}
            hint={records.longest ? date(records.longest.startedAt) : undefined}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Efforts use each run&apos;s average pace, so a 5K inside a longer run is projected from that run&apos;s pace.
        </p>
      </section>

      <section aria-labelledby="recent-runs">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="recent-runs" className="text-[15px] font-medium">
            Recent runs
          </h2>
          <Link href="/fitness/history" className="text-xs text-muted hover:text-foreground">
            All sessions
          </Link>
        </div>
        <SessionList sessions={recent.rows} timezone={timezone} />
      </section>
    </div>
  );
}
