/** Pure helpers shared by server and client. */

/** Epley estimated one-rep max. A single is its own 1RM. */
export function estimate1RM(weightKg: number, reps: number) {
  if (reps <= 0 || weightKg <= 0) return 0;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

const kg = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const kg1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 62.5 → "62.5", 60 → "60" */
export function formatWeight(value: number) {
  return kg.format(value);
}

export function formatE1RM(value: number) {
  return kg1.format(value);
}

/** 12450 → "12,450" */
export function formatVolume(value: number) {
  return whole.format(value);
}

/** 3725 → "1h 2m", 900 → "15m" */
export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** "62,5" / "62.5" → 62.5; invalid → null */
export function parseWeightInput(value: string) {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n <= 1000 ? n : null;
}

export function parseRepsInput(value: string) {
  const v = value.trim();
  if (!/^\d{1,3}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= 200 ? n : null;
}
