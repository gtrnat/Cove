"use server";

import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { exercises, workoutSessions, workoutSets } from "@/db/schema";
import { getUserSettings } from "@/features/settings/queries";
import { requireUser } from "@/lib/session";
import { lastSetsFor } from "./queries";
import { exerciseSchema, workoutSchema } from "./schemas";

/*
 * The logger keeps the draft on the client (survives bad gym Wi-Fi and
 * reloads) and sends the whole workout once, on Finish.
 */

export type SaveWorkoutResult = { ok: true; id: string } | { ok: false; message: string };

export async function saveWorkout(input: unknown): Promise<SaveWorkoutResult> {
  const user = await requireUser();
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid workout." };
  const data = parsed.data;

  // Every exercise must be built-in or the user's own.
  const ids = [...new Set(data.exercises.map((e) => e.exerciseId))];
  const allowed = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(inArray(exercises.id, ids), or(isNull(exercises.createdBy), eq(exercises.createdBy, user.id))));
  if (allowed.length !== ids.length) return { ok: false, message: "One of the exercises isn't available." };

  const { timezone } = await getUserSettings(user.id);
  const startedAt = sql`(${data.startedAt}::timestamp at time zone ${timezone})`;
  const session = { title: data.title, startedAt, durationS: data.durationS, notes: data.notes };

  const id = await db.transaction(async (tx) => {
    let sessionId: string;
    if (data.id) {
      const updated = await tx
        .update(workoutSessions)
        .set(session)
        .where(and(eq(workoutSessions.id, data.id), eq(workoutSessions.userId, user.id), eq(workoutSessions.type, "strength")))
        .returning({ id: workoutSessions.id });
      if (updated.length === 0) return null;
      sessionId = updated[0].id;
      await tx.delete(workoutSets).where(eq(workoutSets.sessionId, sessionId));
    } else {
      const [created] = await tx
        .insert(workoutSessions)
        .values({ ...session, userId: user.id, type: "strength" })
        .returning({ id: workoutSessions.id });
      sessionId = created.id;
    }

    await tx.insert(workoutSets).values(
      data.exercises.flatMap((ex, exerciseOrder) =>
        ex.sets.map((s, setOrder) => ({ sessionId, exerciseId: ex.exerciseId, exerciseOrder, setOrder, ...s })),
      ),
    );
    return sessionId;
  });

  if (!id) return { ok: false, message: "That workout no longer exists." };
  refresh();
  return { ok: true, id };
}

export async function deleteWorkout(id: string) {
  const user = await requireUser();
  if (typeof id !== "string" || !id) return;
  await db.delete(workoutSessions).where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id)));
  refresh();
}

/** "Previous" column in the logger. */
export async function getPreviousSets(exerciseIds: string[], excludeSessionId?: string) {
  const user = await requireUser();
  if (!Array.isArray(exerciseIds) || exerciseIds.length > 30) return {};
  const ids = exerciseIds.filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));
  return lastSetsFor(user.id, ids, excludeSessionId);
}

export type CreateExerciseResult =
  | { ok: true; exercise: { id: string; name: string; muscleGroup: string; equipment: string; custom: boolean } }
  | { ok: false; message: string };

export async function createExercise(input: unknown): Promise<CreateExerciseResult> {
  const user = await requireUser();
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid exercise." };

  const name = parsed.data.name.replace(/\s+/g, " ");
  const [clash] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(
      and(
        sql`lower(${exercises.name}) = lower(${name})`,
        or(isNull(exercises.createdBy), eq(exercises.createdBy, user.id)),
      ),
    );
  if (clash) return { ok: false, message: "An exercise with this name already exists. Search for it instead." };

  const [row] = await db
    .insert(exercises)
    .values({ ...parsed.data, name, createdBy: user.id })
    .returning({ id: exercises.id, name: exercises.name, muscleGroup: exercises.muscleGroup, equipment: exercises.equipment });
  return { ok: true, exercise: { ...row, custom: true } };
}
