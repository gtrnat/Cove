import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const muscleGroup = pgEnum("muscle_group", [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "full_body",
]);

export const equipment = pgEnum("equipment", [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "smith",
  "bodyweight",
  "kettlebell",
  "band",
  "other",
]);

/** Run sessions arrive in Phase 6; the type lives here so history is one table. */
export const sessionType = pgEnum("session_type", ["strength", "run"]);

/** Built-in exercises have createdBy = null. Custom ones are private to their creator. */
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    muscleGroup: muscleGroup("muscle_group").notNull(),
    equipment: equipment("equipment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("exercises_created_by_idx").on(t.createdBy)],
).enableRLS();

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: sessionType("type").notNull(),
    title: text("title").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    durationS: integer("duration_s"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("workout_sessions_user_started_idx").on(t.userId, t.startedAt.desc())],
).enableRLS();

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    /** Order of the exercise within the session */
    exerciseOrder: integer("exercise_order").notNull(),
    /** Order of the set within its exercise */
    setOrder: integer("set_order").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2, mode: "number" }).notNull(),
    reps: integer("reps").notNull(),
    rpe: numeric("rpe", { precision: 3, scale: 1, mode: "number" }),
    isWarmup: boolean("is_warmup").notNull().default(false),
  },
  (t) => [
    index("workout_sets_session_idx").on(t.sessionId),
    index("workout_sets_exercise_idx").on(t.exerciseId),
    check("workout_sets_weight_range", sql`${t.weightKg} >= 0 and ${t.weightKg} <= 1000`),
    check("workout_sets_reps_range", sql`${t.reps} >= 1 and ${t.reps} <= 200`),
  ],
).enableRLS();

export const runType = pgEnum("run_type", ["easy", "tempo", "interval", "long", "race", "recovery"]);
export const runSurface = pgEnum("run_surface", ["road", "treadmill", "trail", "track"]);

/** One row per run session. Duration lives on workout_sessions.duration_s. */
export const runDetails = pgTable(
  "run_details",
  {
    sessionId: uuid("session_id")
      .primaryKey()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    distanceM: integer("distance_m").notNull(),
    runType: runType("run_type").notNull().default("easy"),
    surface: runSurface("surface").notNull().default("road"),
    avgHr: integer("avg_hr"),
    maxHr: integer("max_hr"),
    elevationGainM: integer("elevation_gain_m"),
    cadence: integer("cadence"),
  },
  (t) => [
    check("run_details_distance_range", sql`${t.distanceM} > 0 and ${t.distanceM} <= 500000`),
    check("run_details_hr_range", sql`(${t.avgHr} is null or ${t.avgHr} between 30 and 240) and (${t.maxHr} is null or ${t.maxHr} between 30 and 240)`),
  ],
).enableRLS();

export type RunDetails = typeof runDetails.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
