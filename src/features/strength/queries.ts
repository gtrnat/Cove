import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNull, max, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, runDetails, workoutSessions, workoutSets } from "@/db/schema";
import { estimate1RM } from "./metrics";

const notWarmup = sql`not ${workoutSets.isWarmup}`;
const volumeExpr = sql<number>`coalesce(sum(${workoutSets.weightKg} * ${workoutSets.reps}) filter (where ${notWarmup}), 0)`;

/** Built-in exercises plus the user's own. */
export async function listExercises(userId: string) {
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      equipment: exercises.equipment,
      custom: sql<boolean>`${exercises.createdBy} is not null`,
    })
    .from(exercises)
    .where(or(isNull(exercises.createdBy), eq(exercises.createdBy, userId)))
    .orderBy(asc(exercises.name));
}

export type ExerciseOption = Awaited<ReturnType<typeof listExercises>>[number];

export async function getExercise(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, id), or(isNull(exercises.createdBy), eq(exercises.createdBy, userId))));
  return row ?? null;
}

/** Sets from the most recent session containing each exercise. */
export async function lastSetsFor(userId: string, exerciseIds: string[], excludeSessionId?: string) {
  if (exerciseIds.length === 0) return {} as Record<string, { weightKg: number; reps: number; isWarmup: boolean }[]>;
  const latest = db
    .selectDistinctOn([workoutSets.exerciseId], {
      exerciseId: workoutSets.exerciseId,
      sessionId: workoutSessions.id,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        inArray(workoutSets.exerciseId, exerciseIds),
        excludeSessionId ? ne(workoutSessions.id, excludeSessionId) : undefined,
      ),
    )
    .orderBy(workoutSets.exerciseId, desc(workoutSessions.startedAt))
    .as("latest");

  const rows = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
      isWarmup: workoutSets.isWarmup,
    })
    .from(workoutSets)
    .innerJoin(
      latest,
      and(eq(latest.sessionId, workoutSets.sessionId), eq(latest.exerciseId, workoutSets.exerciseId)),
    )
    .orderBy(workoutSets.exerciseId, workoutSets.setOrder);

  const out: Record<string, { weightKg: number; reps: number; isWarmup: boolean }[]> = {};
  for (const r of rows) (out[r.exerciseId] ??= []).push({ weightKg: r.weightKg, reps: r.reps, isWarmup: r.isWarmup });
  return out;
}

export const HISTORY_PAGE_SIZE = 20;

export async function listSessions(
  userId: string,
  opts: { limit?: number; page?: number; type?: "strength" | "run" } = {},
) {
  const limit = opts.limit ?? HISTORY_PAGE_SIZE;
  const page = opts.page ?? 1;
  const where = and(eq(workoutSessions.userId, userId), opts.type ? eq(workoutSessions.type, opts.type) : undefined);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: workoutSessions.id,
        type: workoutSessions.type,
        title: workoutSessions.title,
        startedAt: workoutSessions.startedAt,
        durationS: workoutSessions.durationS,
        exerciseCount: sql<number>`count(distinct ${workoutSets.exerciseId})`.mapWith(Number),
        setCount: sql<number>`count(${workoutSets.id}) filter (where ${notWarmup})`.mapWith(Number),
        volume: volumeExpr.mapWith(Number),
        exerciseNames: sql<string[]>`coalesce(array_agg(distinct ${exercises.name}) filter (where ${exercises.name} is not null), '{}')`,
        // Runs have no sets, so the run_details join yields one row per run session.
        distanceM: max(runDetails.distanceM),
        runType: max(sql<string>`${runDetails.runType}::text`),
      })
      .from(workoutSessions)
      .leftJoin(workoutSets, eq(workoutSets.sessionId, workoutSessions.id))
      .leftJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
      .leftJoin(runDetails, eq(runDetails.sessionId, workoutSessions.id))
      .where(where)
      .groupBy(workoutSessions.id)
      .orderBy(desc(workoutSessions.startedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(workoutSessions).where(where),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / limit)) };
}

export type SessionSummary = Awaited<ReturnType<typeof listSessions>>["rows"][number];

export async function getSessionDetail(userId: string, id: string) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)));
  if (!session) return null;

  const sets = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      exerciseOrder: workoutSets.exerciseOrder,
      setOrder: workoutSets.setOrder,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
      isWarmup: workoutSets.isWarmup,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(eq(workoutSets.sessionId, id))
    .orderBy(asc(workoutSets.exerciseOrder), asc(workoutSets.setOrder));

  const groups: { exerciseId: string; name: string; muscleGroup: string; sets: typeof sets }[] = [];
  for (const s of sets) {
    const last = groups.at(-1);
    if (last && last.exerciseId === s.exerciseId && last.sets[0].exerciseOrder === s.exerciseOrder) last.sets.push(s);
    else groups.push({ exerciseId: s.exerciseId, name: s.exerciseName, muscleGroup: s.muscleGroup, sets: [s] });
  }
  return { session, exercises: groups };
}

/** Every working set of an exercise with its session date, oldest first. */
export async function exerciseHistory(userId: string, exerciseId: string) {
  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      title: workoutSessions.title,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSets.exerciseId, exerciseId), notWarmup))
    .orderBy(asc(workoutSessions.startedAt), asc(workoutSets.setOrder));

  type Point = { sessionId: string; startedAt: Date; title: string; bestE1RM: number; topWeight: number; topReps: number; volume: number; sets: { weightKg: number; reps: number }[] };
  const sessions: Point[] = [];
  for (const r of rows) {
    let s = sessions.at(-1);
    if (!s || s.sessionId !== r.sessionId) {
      s = { sessionId: r.sessionId, startedAt: r.startedAt, title: r.title, bestE1RM: 0, topWeight: 0, topReps: 0, volume: 0, sets: [] };
      sessions.push(s);
    }
    s.sets.push({ weightKg: r.weightKg, reps: r.reps });
    s.volume += r.weightKg * r.reps;
    s.bestE1RM = Math.max(s.bestE1RM, estimate1RM(r.weightKg, r.reps));
    if (r.weightKg > s.topWeight || (r.weightKg === s.topWeight && r.reps > s.topReps)) {
      s.topWeight = r.weightKg;
      s.topReps = r.reps;
    }
  }

  const best = <K extends keyof Point>(key: K) =>
    sessions.reduce<Point | null>((b, s) => (!b || (s[key] as number) > (b[key] as number) ? s : b), null);
  const mostReps = rows.reduce<(typeof rows)[number] | null>((b, r) => (!b || r.reps > b.reps ? r : b), null);

  return {
    sessions,
    records: {
      e1rm: best("bestE1RM"),
      heaviest: best("topWeight"),
      volume: best("volume"),
      mostReps,
    },
  };
}

/** Exercises the user has trained, most recent first. */
export async function performedExercises(userId: string) {
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      sessions: sql<number>`count(distinct ${workoutSessions.id})`.mapWith(Number),
      lastAt: max(workoutSessions.startedAt),
      bestE1RM: sql<number>`max(case when ${workoutSets.reps} = 1 then ${workoutSets.weightKg} else ${workoutSets.weightKg} * (1 + ${workoutSets.reps} / 30.0) end) filter (where ${notWarmup})`.mapWith(Number),
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(eq(workoutSessions.userId, userId))
    .groupBy(exercises.id)
    .orderBy(desc(max(workoutSessions.startedAt)));
}

export type WeekTotals = { sessions: number; volume: number; runs: number; distanceM: number };
export const EMPTY_WEEK: WeekTotals = { sessions: 0, volume: 0, runs: 0, distanceM: 0 };

/**
 * Weekly totals for the last `weeks` weeks, keyed by the Monday (local date).
 * Grouped by position so the timezone parameter appears only once.
 */
export async function weeklyTotals(userId: string, timeZone: string, weeks = 52) {
  const week = sql<string>`to_char(date_trunc('week', ${workoutSessions.startedAt} at time zone ${timeZone}), 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      week,
      sessions: sql<number>`count(distinct ${workoutSessions.id})`.mapWith(Number),
      volume: volumeExpr.mapWith(Number),
      runs: sql<number>`count(distinct ${runDetails.sessionId})`.mapWith(Number),
      distanceM: sql<number>`coalesce(sum(${runDetails.distanceM}), 0)`.mapWith(Number),
    })
    .from(workoutSessions)
    .leftJoin(workoutSets, eq(workoutSets.sessionId, workoutSessions.id))
    .leftJoin(runDetails, eq(runDetails.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.startedAt, sql`now() - make_interval(weeks => ${weeks + 1})`),
      ),
    )
    .groupBy(sql`1`);
  return Object.fromEntries(
    rows.map((r) => [r.week, { sessions: r.sessions, volume: r.volume, runs: r.runs, distanceM: r.distanceM }]),
  ) as Record<string, WeekTotals>;
}
