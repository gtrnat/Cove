"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { runDetails, workoutSessions } from "@/db/schema";
import { getUserSettings } from "@/features/settings/queries";
import { requireUser } from "@/lib/session";
import { paceSecondsPerKm, plausiblePace, runSurfaces, runTypes } from "./format";

const optionalInt = (min: number, max: number, label: string) =>
  z.number().int().min(min, `${label} looks too low.`).max(max, `${label} looks too high.`).nullable();

const runSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(1, "Give the run a name.").max(80, "Name is too long."),
    startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a start time."),
    distanceM: z.number().int().min(1, "Enter a distance.").max(500_000, "Distance is too long."),
    durationS: z.number().int().min(1, "Enter a duration.").max(172_800, "Duration is too long."),
    runType: z.enum(runTypes),
    surface: z.enum(runSurfaces),
    avgHr: optionalInt(30, 240, "Average heart rate"),
    maxHr: optionalInt(30, 240, "Max heart rate"),
    elevationGainM: optionalInt(0, 10_000, "Elevation gain"),
    cadence: optionalInt(60, 250, "Cadence"),
    notes: z.string().trim().max(1000).nullable(),
  })
  .refine((r) => plausiblePace(paceSecondsPerKm(r.durationS, r.distanceM)), {
    message: "That pace looks off. Check the distance and duration.",
    path: ["durationS"],
  })
  .refine((r) => r.avgHr === null || r.maxHr === null || r.avgHr <= r.maxHr, {
    message: "Average heart rate can't be above max.",
    path: ["avgHr"],
  });

export type SaveRunResult = { ok: true; id: string } | { ok: false; message: string; field?: string };

export async function saveRun(input: unknown): Promise<SaveRunResult> {
  const user = await requireUser();
  const parsed = runSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: issue?.message ?? "Invalid run.", field: issue?.path[0]?.toString() };
  }
  const { id, title, startedAt, durationS, notes, ...details } = parsed.data;
  const { timezone } = await getUserSettings(user.id);
  const session = {
    title,
    durationS,
    notes,
    startedAt: sql`(${startedAt}::timestamp at time zone ${timezone})`,
  };

  const sessionId = await db.transaction(async (tx) => {
    let sid: string;
    if (id) {
      const updated = await tx
        .update(workoutSessions)
        .set(session)
        .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id), eq(workoutSessions.type, "run")))
        .returning({ id: workoutSessions.id });
      if (updated.length === 0) return null;
      sid = updated[0].id;
    } else {
      const [created] = await tx
        .insert(workoutSessions)
        .values({ ...session, userId: user.id, type: "run" })
        .returning({ id: workoutSessions.id });
      sid = created.id;
    }
    await tx
      .insert(runDetails)
      .values({ sessionId: sid, ...details })
      .onConflictDoUpdate({ target: runDetails.sessionId, set: details });
    return sid;
  });

  if (!sessionId) return { ok: false, message: "That run no longer exists." };
  refresh();
  return { ok: true, id: sessionId };
}
