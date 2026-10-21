import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { runDetails, workoutSessions } from "@/db/schema";
import { paceSecondsPerKm } from "./format";

const runColumns = {
  id: workoutSessions.id,
  title: workoutSessions.title,
  startedAt: workoutSessions.startedAt,
  durationS: workoutSessions.durationS,
  notes: workoutSessions.notes,
  distanceM: runDetails.distanceM,
  runType: runDetails.runType,
  surface: runDetails.surface,
  avgHr: runDetails.avgHr,
  maxHr: runDetails.maxHr,
  elevationGainM: runDetails.elevationGainM,
  cadence: runDetails.cadence,
};

export async function getRun(userId: string, id: string) {
  const [row] = await db
    .select(runColumns)
    .from(workoutSessions)
    .innerJoin(runDetails, eq(runDetails.sessionId, workoutSessions.id))
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId), eq(workoutSessions.type, "run")));
  return row ?? null;
}

export type RunRow = NonNullable<Awaited<ReturnType<typeof getRun>>>;

/** All runs, oldest first. Personal-scale data, so stats are computed in TS. */
export async function allRuns(userId: string) {
  return db
    .select(runColumns)
    .from(workoutSessions)
    .innerJoin(runDetails, eq(runDetails.sessionId, workoutSessions.id))
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.type, "run")))
    .orderBy(asc(workoutSessions.startedAt));
}

export async function recentRuns(userId: string, limit = 5) {
  return db
    .select(runColumns)
    .from(workoutSessions)
    .innerJoin(runDetails, eq(runDetails.sessionId, workoutSessions.id))
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.type, "run")))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);
}

type Run = Awaited<ReturnType<typeof allRuns>>[number];
type Effort = { run: Run; seconds: number };

/**
 * Records from whole-run summaries (no GPS splits): the best "5K" is the
 * fastest pace over any run of at least 5 km, projected to exactly 5 km.
 */
export function runRecords(runs: Run[]) {
  const timed = runs.filter((r) => (r.durationS ?? 0) > 0);
  const bestOver = (metres: number): Effort | null => {
    let best: Effort | null = null;
    for (const r of timed) {
      if (r.distanceM < metres) continue;
      const seconds = paceSecondsPerKm(r.durationS!, r.distanceM) * (metres / 1000);
      if (!best || seconds < best.seconds) best = { run: r, seconds };
    }
    return best;
  };
  const longest = runs.reduce<Run | null>((b, r) => (!b || r.distanceM > b.distanceM ? r : b), null);
  return { k1: bestOver(1000), k5: bestOver(5000), k10: bestOver(10000), half: bestOver(21097), longest };
}
