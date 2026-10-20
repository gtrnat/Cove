import { currentMonth, isMonthKey, type MonthKey } from "@/lib/dates";

/** Resolve ?month= against the user's current month; future months clamp to now. */
export function resolveMonth(param: string | string[] | undefined, timeZone: string, now: Date) {
  const current = currentMonth(timeZone, now);
  const raw = Array.isArray(param) ? param[0] : param;
  const month: MonthKey = isMonthKey(raw) && raw <= current ? raw : current;
  return { month, current };
}
