import "server-only";
import { connection } from "next/server";
import { addDays, todayKey, weekStart } from "@/lib/dates";
import { getFitnessContext } from "./context";
import { weeklyTotals } from "./queries";

/** This week's totals, consecutive training weeks, and the last `chartWeeks` weeks. */
export async function getTrainingSummary(chartWeeks = 8) {
  const { user, timezone } = await getFitnessContext();
  await connection();
  const totals = await weeklyTotals(user.id, timezone, 52);
  const thisWeek = weekStart(todayKey(timezone));

  // The current week only counts once it has a session; it isn't over yet.
  let streak = 0;
  let cursor = totals[thisWeek]?.sessions ? thisWeek : addDays(thisWeek, -7);
  while (totals[cursor]?.sessions) {
    streak++;
    cursor = addDays(cursor, -7);
  }

  const weeks = Array.from({ length: chartWeeks }, (_, i) => {
    const key = addDays(thisWeek, -7 * (chartWeeks - 1 - i));
    return { week: key, ...(totals[key] ?? { sessions: 0, volume: 0 }) };
  });

  return {
    thisWeek: totals[thisWeek] ?? { sessions: 0, volume: 0 },
    streak,
    weeks,
    timezone,
  };
}
