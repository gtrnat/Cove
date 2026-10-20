import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { provisionUser } from "./provision";

/**
 * Settings for a user. Provisions defaults on the fly if the sign-up hook
 * didn't get to finish, so callers can always rely on a row existing.
 */
export async function getUserSettings(userId: string) {
  const row = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
  if (row) return row;

  await provisionUser(userId);
  const created = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
  if (!created) throw new Error("Could not create user settings");
  return created;
}
