import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { bodyMetrics, foodLogs, foods, foodUnits } from "@/db/schema";
import { nameSimilarity, normalizeFoodName } from "./math";

export type FoodWithUnits = {
  id: string;
  name: string;
  brand: string | null;
  status: "verified" | "community";
  proteinPer100g: number;
  caloriesPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  units: { id: string; label: string; gramsPerUnit: number; isDefault: boolean }[];
};

const foodColumns = {
  id: foods.id,
  name: foods.name,
  brand: foods.brand,
  status: foods.status,
  proteinPer100g: foods.proteinPer100g,
  caloriesPer100g: foods.caloriesPer100g,
  carbsPer100g: foods.carbsPer100g,
  fatPer100g: foods.fatPer100g,
};

function like(term: string) {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

async function attachUnits<T extends { id: string }>(rows: T[]): Promise<(T & Pick<FoodWithUnits, "units">)[]> {
  if (rows.length === 0) return [];
  const units = await db
    .select({
      id: foodUnits.id,
      foodId: foodUnits.foodId,
      label: foodUnits.label,
      gramsPerUnit: foodUnits.gramsPerUnit,
      isDefault: foodUnits.isDefault,
    })
    .from(foodUnits)
    .where(inArray(foodUnits.foodId, rows.map((r) => r.id)))
    .orderBy(desc(foodUnits.isDefault), asc(foodUnits.gramsPerUnit));
  const byFood = new Map<string, FoodWithUnits["units"]>();
  for (const u of units) {
    const list = byFood.get(u.foodId) ?? [];
    list.push({ id: u.id, label: u.label, gramsPerUnit: u.gramsPerUnit, isDefault: u.isDefault });
    byFood.set(u.foodId, list);
  }
  return rows.map((r) => ({ ...r, units: byFood.get(r.id) ?? [] }));
}

/** Every word must appear in the name or brand. Verified first, then most used. */
export async function searchFoods(query: string, limit = 20): Promise<FoodWithUnits[]> {
  const tokens = normalizeFoodName(query).split(" ").filter(Boolean).slice(0, 6);
  const rows = await db
    .select(foodColumns)
    .from(foods)
    .where(
      and(
        ...tokens.map((t) => or(ilike(foods.nameNormalized, like(t)), ilike(foods.brand, like(t)))),
      ),
    )
    .orderBy(
      sql`case when ${foods.status} = 'verified' then 0 else 1 end`,
      desc(foods.usageCount),
      sql`length(${foods.name})`,
    )
    .limit(limit);
  return attachUnits(rows);
}

/** Community foods, newest first (for moderation). */
export async function newestCommunityFoods(limit = 100): Promise<FoodWithUnits[]> {
  const rows = await db
    .select(foodColumns)
    .from(foods)
    .where(eq(foods.status, "community"))
    .orderBy(desc(foods.createdAt))
    .limit(limit);
  return attachUnits(rows);
}

export async function getFood(id: string): Promise<FoodWithUnits | null> {
  const [row] = await db.select(foodColumns).from(foods).where(eq(foods.id, id));
  if (!row) return null;
  return (await attachUnits([row]))[0];
}

/** Foods this user logged most recently, with the unit and quantity they used last. */
export async function recentFoods(userId: string, limit = 8) {
  const latest = await db
    .selectDistinctOn([foodLogs.foodId], {
      foodId: foodLogs.foodId,
      unitId: foodLogs.unitId,
      quantity: foodLogs.quantity,
      createdAt: foodLogs.createdAt,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), sql`${foodLogs.foodId} is not null`))
    .orderBy(foodLogs.foodId, desc(foodLogs.createdAt));

  const top = latest.sort((a, b) => +b.createdAt - +a.createdAt).slice(0, limit);
  if (top.length === 0) return [];
  const rows = await db
    .select(foodColumns)
    .from(foods)
    .where(inArray(foods.id, top.map((t) => t.foodId!)));
  const withUnits = await attachUnits(rows);
  const byId = new Map(withUnits.map((f) => [f.id, f]));
  return top
    .map((t) => {
      const food = byId.get(t.foodId!);
      return food ? { food, lastUnitId: t.unitId, lastQuantity: t.quantity } : null;
    })
    .filter((x) => x !== null);
}

export type RecentFood = Awaited<ReturnType<typeof recentFoods>>[number];

/** Likely duplicates of a proposed name. */
export async function similarFoods(name: string, limit = 5) {
  const normalized = normalizeFoodName(name);
  const tokens = normalized.split(" ").filter((t) => t.length >= 3).slice(0, 6);
  if (tokens.length === 0) return [];
  const candidates = await db
    .select({ id: foods.id, name: foods.name, brand: foods.brand, status: foods.status, proteinPer100g: foods.proteinPer100g })
    .from(foods)
    .where(or(...tokens.map((t) => ilike(foods.nameNormalized, like(t.slice(0, Math.max(3, t.length - 1)))))))
    .limit(100);
  return candidates
    .map((c) => ({ ...c, score: nameSimilarity(name, c.brand ? `${c.name} ${c.brand}` : c.name) }))
    .filter((c) => c.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function dayLog(userId: string, day: string) {
  return db
    .select({
      id: foodLogs.id,
      foodId: foodLogs.foodId,
      name: foodLogs.nameSnapshot,
      unitLabel: foodLogs.unitLabelSnapshot,
      quantity: foodLogs.quantity,
      grams: foodLogs.grams,
      proteinG: foodLogs.proteinG,
      calories: foodLogs.calories,
      meal: foodLogs.meal,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), eq(foodLogs.loggedOn, day)))
    .orderBy(asc(foodLogs.createdAt));
}

export type DayLogEntry = Awaited<ReturnType<typeof dayLog>>[number];

/** Protein and calories per day between two local dates (inclusive). */
export async function dailyTotals(userId: string, from: string, to: string) {
  const rows = await db
    .select({
      day: foodLogs.loggedOn,
      protein: sum(foodLogs.proteinG).mapWith(Number),
      calories: sum(foodLogs.calories).mapWith(Number),
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), gte(foodLogs.loggedOn, from), lte(foodLogs.loggedOn, to)))
    .groupBy(foodLogs.loggedOn);
  return Object.fromEntries(rows.map((r) => [r.day, { protein: r.protein, calories: r.calories }])) as Record<
    string,
    { protein: number; calories: number }
  >;
}

export async function weightHistory(userId: string, limit = 60) {
  const rows = await db
    .select({ day: bodyMetrics.measuredOn, weightKg: bodyMetrics.weightKg })
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.measuredOn))
    .limit(limit);
  return rows.reverse();
}

export async function listFoods(query: string, limit = 60) {
  if (query.trim()) return searchFoods(query, limit);
  const rows = await db
    .select(foodColumns)
    .from(foods)
    .orderBy(
      sql`case when ${foods.status} = 'verified' then 0 else 1 end`,
      desc(foods.usageCount),
      asc(foods.name),
    )
    .limit(limit);
  return attachUnits(rows);
}
