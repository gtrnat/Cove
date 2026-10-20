/*
 * Timezone-aware date helpers without a date library. All "local" values are
 * wall-clock strings in the user's timezone; conversion to UTC instants for
 * storage happens in Postgres (`'...'::timestamp AT TIME ZONE tz`).
 */

/** "YYYY-MM" */
export type MonthKey = `${number}-${number}`;

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && MONTH_RE.test(value);
}

/** Current month in a timezone, e.g. "2026-10". */
export function currentMonth(timeZone: string, now = new Date()): MonthKey {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}` as MonthKey;
}

/** Today's day-of-month in a timezone. */
export function todayKey(timeZone: string, now = new Date()) {
  return toLocalDateTime(now, timeZone).slice(0, 10);
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}` as MonthKey;
}

/** Wall-clock bounds of a month: start inclusive, end exclusive. */
export function monthBounds(month: MonthKey) {
  return { start: `${month}-01 00:00:00`, end: `${shiftMonth(month, 1)}-01 00:00:00` };
}

export function daysInMonth(month: MonthKey) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "October 2026" */
export function formatMonth(month: MonthKey) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

/** Instant → "YYYY-MM-DDTHH:mm" in a timezone (for datetime-local inputs). */
export function toLocalDateTime(date: Date, timeZone: string) {
  // sv-SE formats as "2026-10-18 11:03"
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return s.replace(" ", "T");
}

/** "Sat, 18 Oct" */
export function formatDayHeading(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Instant → "11:03" in a timezone */
export function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Instant → "18 Oct" in a timezone */
export function formatShortDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short" }).format(date);
}
