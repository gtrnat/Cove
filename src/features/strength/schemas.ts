import { z } from "zod";
import { equipmentTypes, muscleGroups } from "./labels";

const setSchema = z.object({
  weightKg: z.number().min(0).max(1000).multipleOf(0.01),
  reps: z.number().int().min(1).max(200),
  isWarmup: z.boolean(),
});

export const workoutSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Give the workout a name.").max(80, "Name is too long."),
  /** datetime-local in the user's timezone */
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a start time."),
  durationS: z.number().int().min(0).max(86_400).nullable(),
  notes: z.string().trim().max(1000).nullable(),
  exercises: z
    .array(z.object({ exerciseId: z.uuid(), sets: z.array(setSchema).min(1).max(50) }))
    .min(1, "Complete at least one set.")
    .max(30, "That's a lot of exercises. Split it into two workouts."),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;

export const exerciseSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Keep it under 60 characters."),
  muscleGroup: z.enum(muscleGroups, "Pick a muscle group."),
  equipment: z.enum(equipmentTypes, "Pick the equipment."),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
