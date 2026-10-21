import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/** verified = curated (seed or admin-approved); community = added by a user, visible to everyone. */
export const foodStatus = pgEnum("food_status", ["verified", "community"]);
export const mealType = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]);

const num = (name: string, precision: number, scale: number) => numeric(name, { precision, scale, mode: "number" });

/** Shared food database. Nutrition is stored per 100 g; units convert to grams. */
export const foods = pgTable(
  "foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** lower-cased, punctuation-stripped name for search and duplicate checks */
    nameNormalized: text("name_normalized").notNull(),
    brand: text("brand"),
    proteinPer100g: num("protein_per_100g", 5, 2).notNull(),
    caloriesPer100g: num("calories_per_100g", 6, 1),
    carbsPer100g: num("carbs_per_100g", 5, 2),
    fatPer100g: num("fat_per_100g", 5, 2),
    status: foodStatus("status").notNull().default("community"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    usageCount: integer("usage_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("foods_name_normalized_idx").on(t.nameNormalized),
    index("foods_created_by_idx").on(t.createdBy),
    check("foods_protein_range", sql`${t.proteinPer100g} >= 0 and ${t.proteinPer100g} <= 100`),
  ],
).enableRLS();

export const foodUnits = pgTable(
  "food_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    /** "g", "piece", "slice", "scoop", ... */
    label: text("label").notNull(),
    gramsPerUnit: num("grams_per_unit", 7, 2).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (t) => [
    unique("food_units_food_label_key").on(t.foodId, t.label),
    check("food_units_grams_positive", sql`${t.gramsPerUnit} > 0`),
  ],
).enableRLS();

/**
 * One food eaten. Name, unit, protein, and calories are snapshots so past
 * days don't change when a food is corrected or merged.
 */
export const foodLogs = pgTable(
  "food_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    foodId: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
    unitId: uuid("unit_id").references(() => foodUnits.id, { onDelete: "set null" }),
    nameSnapshot: text("name_snapshot").notNull(),
    unitLabelSnapshot: text("unit_label_snapshot").notNull(),
    quantity: num("quantity", 7, 2).notNull(),
    grams: num("grams", 8, 2).notNull(),
    proteinG: num("protein_g", 6, 1).notNull(),
    calories: num("calories", 7, 1),
    meal: mealType("meal").notNull(),
    /** Local calendar day in the user's timezone */
    loggedOn: date("logged_on", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("food_logs_user_day_idx").on(t.userId, t.loggedOn),
    index("food_logs_food_idx").on(t.foodId),
    check("food_logs_quantity_positive", sql`${t.quantity} > 0`),
  ],
).enableRLS();

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measuredOn: date("measured_on", { mode: "string" }).notNull(),
    weightKg: num("weight_kg", 5, 2).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("body_metrics_user_day_key").on(t.userId, t.measuredOn),
    check("body_metrics_weight_range", sql`${t.weightKg} >= 20 and ${t.weightKg} <= 400`),
  ],
).enableRLS();

export type Food = typeof foods.$inferSelect;
export type FoodUnit = typeof foodUnits.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
