"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { bodyMetrics, foodLogs, foods, foodUnits } from "@/db/schema";
import { getUserSettings } from "@/features/settings/queries";
import { addDays, todayKey } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { macrosPlausible, normalizeFoodName, nutrientFor, round1 } from "./math";
import { getFood, searchFoods, similarFoods, type FoodWithUnits } from "./queries";
import { createFoodSchema, logFoodSchema, weightSchema } from "./schemas";

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const MAX_NEW_FOODS_PER_DAY = 20;

/** Logs can be for today or earlier, plus one day of slack for timezone edges. */
async function assertDayAllowed(userId: string, day: string) {
  const { timezone } = await getUserSettings(userId);
  return day <= addDays(todayKey(timezone), 1);
}

export async function searchFoodsAction(query: string): Promise<FoodWithUnits[]> {
  await requireUser();
  if (typeof query !== "string" || query.trim().length < 2) return [];
  return searchFoods(query.slice(0, 80));
}

export async function getFoodAction(id: string): Promise<FoodWithUnits | null> {
  await requireUser();
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return getFood(id);
}

export async function similarFoodsAction(name: string) {
  await requireUser();
  if (typeof name !== "string" || name.trim().length < 3) return [];
  return similarFoods(name.slice(0, 80));
}

export async function logFood(input: unknown): Promise<Result> {
  const me = await requireUser();
  const parsed = logFoodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid entry." };
  const { foodId, unitId, quantity, meal, day } = parsed.data;
  if (!(await assertDayAllowed(me.id, day))) return { ok: false, message: "You can't log food for a future day." };

  const food = await getFood(foodId);
  const unit = food?.units.find((u) => u.id === unitId);
  if (!food || !unit) return { ok: false, message: "That food or unit isn't available anymore." };

  const grams = quantity * unit.gramsPerUnit;
  await db.transaction(async (tx) => {
    await tx.insert(foodLogs).values({
      userId: me.id,
      foodId,
      unitId,
      nameSnapshot: food.brand ? `${food.name} · ${food.brand}` : food.name,
      unitLabelSnapshot: unit.label,
      quantity,
      grams: Math.round(grams * 100) / 100,
      proteinG: round1(nutrientFor(quantity, unit.gramsPerUnit, food.proteinPer100g)),
      calories: food.caloriesPer100g === null ? null : round1(nutrientFor(quantity, unit.gramsPerUnit, food.caloriesPer100g)),
      meal,
      loggedOn: day,
    });
    await tx.update(foods).set({ usageCount: sql`${foods.usageCount} + 1` }).where(eq(foods.id, foodId));
  });
  refresh();
  return { ok: true };
}

export async function deleteFoodLog(id: string) {
  const me = await requireUser();
  if (typeof id !== "string" || !id) return;
  await db.delete(foodLogs).where(and(eq(foodLogs.id, id), eq(foodLogs.userId, me.id)));
  refresh();
}

export async function createFood(input: unknown): Promise<Result<{ food: FoodWithUnits }>> {
  const me = await requireUser();
  const parsed = createFoodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid food." };
  const d = parsed.data;

  if (d.basis === "serving" && (!d.servingGrams || !d.servingLabel)) {
    return { ok: false, message: "Enter the serving name and its weight in grams." };
  }
  const factor = d.basis === "serving" ? 100 / d.servingGrams! : 1;
  const per100 = (v: number | null) => (v === null ? null : Math.round(v * factor * 100) / 100);
  const macros = { protein: per100(d.protein)!, calories: per100(d.calories), carbs: per100(d.carbs), fat: per100(d.fat) };
  if (macros.protein > 100) return { ok: false, message: "That's more than 100 g of protein per 100 g. Check the serving size." };
  const implausible = macrosPlausible(macros);
  if (implausible) return { ok: false, message: implausible };

  const nameNormalized = normalizeFoodName(d.name);
  const [{ n }] = await db
    .select({ n: count() })
    .from(foods)
    .where(and(eq(foods.createdBy, me.id), gte(foods.createdAt, sql`now() - interval '1 day'`)));
  if (n >= MAX_NEW_FOODS_PER_DAY) return { ok: false, message: "You've added a lot of foods today. Try again tomorrow." };

  const [exact] = await db
    .select({ id: foods.id })
    .from(foods)
    .where(
      and(
        eq(foods.nameNormalized, nameNormalized),
        sql`coalesce(lower(${foods.brand}), '') = ${d.brand?.toLowerCase() ?? ""}`,
      ),
    );
  if (exact) return { ok: false, message: "This food already exists. Search for it instead." };

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(foods)
      .values({
        name: d.name.replace(/\s+/g, " "),
        nameNormalized,
        brand: d.brand,
        proteinPer100g: macros.protein,
        caloriesPer100g: macros.calories,
        carbsPer100g: macros.carbs,
        fatPer100g: macros.fat,
        status: "community",
        createdBy: me.id,
      })
      .returning({ id: foods.id });
    const units = [{ foodId: row.id, label: "g", gramsPerUnit: 1, isDefault: d.basis === "100g" }];
    if (d.basis === "serving") {
      const label = d.servingLabel!.toLowerCase() === "g" ? "serving" : d.servingLabel!;
      units.push({ foodId: row.id, label, gramsPerUnit: d.servingGrams!, isDefault: true });
    }
    await tx.insert(foodUnits).values(units);
    return row.id;
  });

  const food = await getFood(id);
  refresh();
  return { ok: true, food: food! };
}

export async function saveWeight(input: unknown): Promise<Result> {
  const me = await requireUser();
  const parsed = weightSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid weight." };
  if (!(await assertDayAllowed(me.id, parsed.data.day))) return { ok: false, message: "That day is in the future." };
  await db
    .insert(bodyMetrics)
    .values({ userId: me.id, measuredOn: parsed.data.day, weightKg: parsed.data.weightKg })
    .onConflictDoUpdate({
      target: [bodyMetrics.userId, bodyMetrics.measuredOn],
      set: { weightKg: parsed.data.weightKg },
    });
  refresh();
  return { ok: true };
}
