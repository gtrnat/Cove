import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const transactionType = pgEnum("transaction_type", ["expense", "income"]);
export const transactionSource = pgEnum("transaction_source", ["manual", "email"]);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionType("type").notNull(),
    name: text("name").notNull(),
    /** Key into the icon map in src/features/finance/icons.ts */
    icon: text("icon").notNull().default("circle"),
    color: text("color").notNull().default("#8b8b93"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // The unique index leads with user_id, so it also serves per-user lookups.
  (t) => [unique("categories_user_type_name_key").on(t.userId, t.type, t.name)],
).enableRLS();

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionType("type").notNull(),
    /** Whole rupiah, always positive. Direction comes from `type`. */
    amount: bigint("amount", { mode: "number" }).notNull(),
    /** Merchant for expenses, payer/source for income. */
    merchant: text("merchant").notNull(),
    description: text("description"),
    /** Null when uncategorized; kept if a category is archived. */
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    source: transactionSource("source").notNull().default("manual"),
    /** e.g. "bca" for email imports */
    provider: text("provider"),
    /** Idempotency key for imports (BCA Reference No. or Gmail message id). */
    externalId: text("external_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transactions_user_occurred_idx").on(t.userId, t.occurredAt.desc()),
    index("transactions_category_idx").on(t.categoryId),
    // NULLs are distinct in Postgres, so manual rows (no external id) never collide.
    unique("transactions_user_external_key").on(t.userId, t.externalId),
    check("transactions_amount_positive", sql`${t.amount} > 0`),
  ],
).enableRLS();

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
