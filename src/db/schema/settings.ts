import { bigint, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("IDR"),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  dailyProteinTargetG: integer("daily_protein_target_g"),
  /** Whole rupiah. */
  monthlyBudget: bigint("monthly_budget", { mode: "number" }),
  distanceUnit: text("distance_unit", { enum: ["km", "mi"] }).notNull().default("km"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export type UserSettings = typeof userSettings.$inferSelect;
