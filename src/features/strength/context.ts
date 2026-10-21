import "server-only";
import { cache } from "react";
import { getUserSettings } from "@/features/settings/queries";
import { requireUser } from "@/lib/session";

export const getFitnessContext = cache(async () => {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);
  return { user, settings, timezone: settings.timezone };
});
