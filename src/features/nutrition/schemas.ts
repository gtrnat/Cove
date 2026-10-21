import { z } from "zod";
import { meals } from "./math";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day.");

export const logFoodSchema = z.object({
  foodId: z.uuid(),
  unitId: z.uuid(),
  quantity: z.number().gt(0, "Enter how much you ate.").max(10_000, "That's a lot. Check the amount."),
  meal: z.enum(meals),
  day,
});

const optionalMacro = z.number().min(0).max(1000).nullable();

export const createFoodSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep it under 80 characters."),
  brand: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v || null)
    .nullable(),
  /** Values below are per 100 g, or per one serving of `servingGrams`. */
  basis: z.enum(["100g", "serving"]),
  servingLabel: z.string().trim().max(30).nullable(),
  servingGrams: z.number().gt(0).max(5000).nullable(),
  protein: z.number().min(0, "Protein can't be negative.").max(1000),
  calories: optionalMacro,
  carbs: optionalMacro,
  fat: optionalMacro,
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export const weightSchema = z.object({
  day,
  weightKg: z.number().min(20, "That weight looks too low.").max(400, "That weight looks too high."),
});
