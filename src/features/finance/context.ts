import "server-only";
import { cache } from "react";
import { getUserSettings } from "@/features/settings/queries";
import { requireUser } from "@/lib/session";
import { getCategories } from "./queries";

/**
 * Signed-in user, their timezone, and active categories. cache() dedupes this
 * per request, so the header button and the list can both call it.
 */
export const getFinanceContext = cache(async () => {
  const user = await requireUser();
  const [settings, cats] = await Promise.all([getUserSettings(user.id), getCategories(user.id)]);
  return {
    user,
    settings,
    timezone: settings.timezone,
    categories: cats,
    categoryChoices: cats.map((c) => ({ id: c.id, name: c.name, type: c.type })),
  };
});
