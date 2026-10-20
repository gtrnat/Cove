import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/** Shared by categories and (Phase 3) transactions. */
export const transactionType = pgEnum("transaction_type", ["expense", "income"]);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionType("type").notNull(),
    name: text("name").notNull(),
    /** lucide icon name, e.g. "utensils" */
    icon: text("icon").notNull().default("circle"),
    color: text("color").notNull().default("#8b8b93"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // The unique index leads with user_id, so it also serves per-user lookups.
  (t) => [unique("categories_user_type_name_key").on(t.userId, t.type, t.name)],
).enableRLS();

export type Category = typeof categories.$inferSelect;
