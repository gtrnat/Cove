"use server";

import { refresh } from "next/cache";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { fieldErrors } from "@/features/auth/schemas";
import { requireUser } from "@/lib/session";
import { preferencesSchema, type ActionState } from "./schemas";

export async function updatePreferences(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Always re-check auth inside Server Actions; the proxy can't be relied on here.
  const user = await requireUser();

  const parsed = preferencesSchema.safeParse({
    dailyProteinTargetG: formData.get("dailyProteinTargetG") ?? "",
    monthlyBudget: formData.get("monthlyBudget") ?? "",
    timezone: formData.get("timezone") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  // Upsert: works even if the row was never provisioned.
  await db
    .insert(userSettings)
    .values({ userId: user.id, ...parsed.data })
    .onConflictDoUpdate({ target: userSettings.userId, set: parsed.data });

  refresh();
  return { status: "success", message: "Preferences saved." };
}
