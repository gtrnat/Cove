import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Per-user API keys for the Gmail Apps Script. The token is shown once; only
 * a SHA-256 of its random secret is stored (the secret is 192 bits of
 * entropy, so a fast hash is appropriate).
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Public lookup id embedded in the token: cove_<keyId>_<secret> */
    keyId: text("key_id").notNull().unique(),
    secretHash: text("secret_hash").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("api_keys_user_id_idx").on(t.userId)],
).enableRLS();

export type ApiKey = typeof apiKeys.$inferSelect;
