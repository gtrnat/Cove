import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

/*
 * Supabase transaction pooler (port 6543) doesn't support prepared
 * statements, so `prepare: false` is required.
 *
 * In development the client is cached on globalThis so hot reloads don't open
 * a new pool every time.
 */
const globalForDb = globalThis as unknown as { pg?: postgres.Sql };

const client =
  globalForDb.pg ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export type Database = typeof db;
