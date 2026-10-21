import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatClock } from "@/features/running/format";
import { getRun } from "@/features/running/queries";
import { RunForm, type RunFormInitial } from "@/features/running/run-form";
import { getFitnessContext } from "@/features/strength/context";
import { toLocalDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Log run" };

export default function LogRunPage(props: PageProps<"/fitness/log/run">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
      <RunLogger searchParams={props.searchParams} />
    </Suspense>
  );
}

function defaultTitle(date: Date, timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date));
  if (hour < 11) return "Morning run";
  if (hour < 15) return "Midday run";
  if (hour < 18) return "Afternoon run";
  return "Evening run";
}

async function RunLogger({ searchParams }: Pick<PageProps<"/fitness/log/run">, "searchParams">) {
  const [{ user, timezone }, params] = await Promise.all([getFitnessContext(), searchParams]);
  await connection();
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  let initial: RunFormInitial;
  if (editId) {
    const run = /^[0-9a-f-]{36}$/i.test(editId) ? await getRun(user.id, editId) : null;
    if (!run) notFound();
    const str = (v: number | null) => (v === null ? "" : String(v));
    initial = {
      id: run.id,
      title: run.title,
      startedAt: toLocalDateTime(run.startedAt, timezone),
      distance: String(run.distanceM / 1000),
      duration: run.durationS ? formatClock(run.durationS) : "",
      runType: run.runType,
      surface: run.surface,
      avgHr: str(run.avgHr),
      maxHr: str(run.maxHr),
      elevationGainM: str(run.elevationGainM),
      cadence: str(run.cadence),
      notes: run.notes ?? "",
    };
  } else {
    const now = new Date();
    initial = {
      title: defaultTitle(now, timezone),
      startedAt: toLocalDateTime(now, timezone),
      distance: "",
      duration: "",
      runType: "easy",
      surface: "road",
      avgHr: "",
      maxHr: "",
      elevationGainM: "",
      cadence: "",
      notes: "",
    };
  }

  return <RunForm key={editId ?? "new"} initial={initial} />;
}
