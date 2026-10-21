"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { foodLogs, foods, foodUnits } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { macrosPlausible, normalizeFoodName } from "./math";

type Result = { ok: true; message?: string } | { ok: false; message: string };

const uuid = z.uuid();
const macro = z.number().min(0).max(1000).nullable();

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  brand: z.string().trim().max(60).transform((v) => v || null).nullable(),
  proteinPer100g: z.number().min(0).max(100),
  caloriesPer100g: macro,
  carbsPer100g: z.number().min(0).max(100).nullable(),
  fatPer100g: z.number().min(0).max(100).nullable(),
  status: z.enum(["verified", "community"]),
});

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function updateFood(id: string, input: unknown): Promise<Result> {
  await requireAdmin();
  if (!uuid.safeParse(id).success) return { ok: false, message: "Missing food." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid values." };
  const d = parsed.data;
  const implausible = macrosPlausible({ protein: d.proteinPer100g, carbs: d.carbsPer100g, fat: d.fatPer100g, calories: d.caloriesPer100g });
  if (implausible) return { ok: false, message: implausible };
  try {
    await db
      .update(foods)
      .set({ ...d, name: d.name.replace(/\s+/g, " "), nameNormalized: normalizeFoodName(d.name) })
      .where(eq(foods.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: "Another food already has this name and brand. Merge them instead." };
    throw error;
  }
  refresh();
  return { ok: true, message: "Saved." };
}

export async function addFoodUnit(foodId: string, label: string, grams: number): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({ foodId: uuid, label: z.string().trim().min(1).max(30), grams: z.number().gt(0).max(5000) })
    .safeParse({ foodId, label, grams });
  if (!parsed.success) return { ok: false, message: "Enter a unit name and its weight in grams." };
  const inserted = await db
    .insert(foodUnits)
    .values({ foodId, label: parsed.data.label, gramsPerUnit: parsed.data.grams })
    .onConflictDoNothing()
    .returning({ id: foodUnits.id });
  if (inserted.length === 0) return { ok: false, message: "This food already has that unit." };
  refresh();
  return { ok: true };
}

export async function deleteFoodUnit(unitId: string): Promise<Result> {
  await requireAdmin();
  if (!uuid.safeParse(unitId).success) return { ok: false, message: "Missing unit." };
  const [unit] = await db.select().from(foodUnits).where(eq(foodUnits.id, unitId));
  if (!unit) return { ok: false, message: "That unit no longer exists." };
  const [{ others }] = await db
    .select({ others: sql<number>`count(*)::int` })
    .from(foodUnits)
    .where(and(eq(foodUnits.foodId, unit.foodId), ne(foodUnits.id, unitId)));
  if (others === 0) return { ok: false, message: "A food needs at least one unit." };

  await db.transaction(async (tx) => {
    await tx.delete(foodUnits).where(eq(foodUnits.id, unitId));
    if (unit.isDefault) {
      // Promote grams (or any remaining unit) to default.
      await tx.execute(sql`
        update food_units set is_default = true
        where id = (select id from food_units where food_id = ${unit.foodId} order by (label = 'g') desc limit 1)`);
    }
  });
  refresh();
  return { ok: true };
}

/**
 * Fold `sourceId` into `targetId`: logs and usage move to the target, units
 * the target lacks are moved over, then the source is deleted. Past log
 * entries keep their snapshot values.
 */
export async function mergeFoods(sourceId: string, targetId: string): Promise<Result> {
  await requireAdmin();
  if (!uuid.safeParse(sourceId).success || !uuid.safeParse(targetId).success || sourceId === targetId) {
    return { ok: false, message: "Pick a different food to merge into." };
  }
  const outcome = await db.transaction(async (tx) => {
    const [source] = await tx.select().from(foods).where(eq(foods.id, sourceId));
    const [target] = await tx.select().from(foods).where(eq(foods.id, targetId));
    if (!source || !target) return null;

    const sourceUnits = await tx.select().from(foodUnits).where(eq(foodUnits.foodId, sourceId));
    const targetUnits = await tx.select().from(foodUnits).where(eq(foodUnits.foodId, targetId));
    const byLabel = new Map(targetUnits.map((u) => [u.label.toLowerCase(), u]));

    for (const u of sourceUnits) {
      const match = byLabel.get(u.label.toLowerCase());
      if (match) {
        await tx.update(foodLogs).set({ unitId: match.id }).where(eq(foodLogs.unitId, u.id));
        await tx.delete(foodUnits).where(eq(foodUnits.id, u.id));
      } else {
        await tx.update(foodUnits).set({ foodId: targetId, isDefault: false }).where(eq(foodUnits.id, u.id));
      }
    }
    await tx.update(foodLogs).set({ foodId: targetId }).where(eq(foodLogs.foodId, sourceId));
    await tx
      .update(foods)
      .set({ usageCount: sql`${foods.usageCount} + ${source.usageCount}` })
      .where(eq(foods.id, targetId));
    await tx.delete(foods).where(eq(foods.id, sourceId));
    return target.name;
  });
  if (!outcome) return { ok: false, message: "One of the foods no longer exists." };
  refresh();
  return { ok: true, message: `Merged into ${outcome}.` };
}

export async function deleteFood(id: string): Promise<Result> {
  await requireAdmin();
  if (!uuid.safeParse(id).success) return { ok: false, message: "Missing food." };
  await db.delete(foods).where(eq(foods.id, id)); // logs keep their snapshots (food_id set null)
  refresh();
  return { ok: true };
}
