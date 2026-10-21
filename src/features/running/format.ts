/** Pure running helpers, shared by server and client. */

export const runTypes = ["easy", "tempo", "interval", "long", "race", "recovery"] as const;
export const runSurfaces = ["road", "treadmill", "trail", "track"] as const;
export type RunType = (typeof runTypes)[number];
export type RunSurface = (typeof runSurfaces)[number];

export const runTypeLabels: Record<RunType, string> = {
  easy: "Easy",
  tempo: "Tempo",
  interval: "Intervals",
  long: "Long run",
  race: "Race",
  recovery: "Recovery",
};

export const surfaceLabels: Record<RunSurface, string> = {
  road: "Road",
  treadmill: "Treadmill",
  trail: "Trail",
  track: "Track",
};

/** Seconds per km. */
export function paceSecondsPerKm(durationS: number, distanceM: number) {
  return distanceM > 0 ? durationS / (distanceM / 1000) : 0;
}

/** 342 → "5:42" */
export function formatPace(secondsPerKm: number) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "—";
  const total = Math.round(secondsPerKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** 18420 → "18.42" (km) */
export function formatKm(distanceM: number, digits = 2) {
  const km = distanceM / 1000;
  // Number() drops trailing zeros: "18.40" → 18.4
  return String(Number(km.toFixed(km >= 100 ? 1 : digits)));
}

/** 3725 → "1:02:05", 1500 → "25:00" */
export function formatClock(seconds: number) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "5.2" / "5,2" km → metres; invalid → null */
export function parseKmInput(value: string) {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,3})?$/.test(v)) return null;
  const m = Math.round(Number(v) * 1000);
  return m > 0 && m <= 500_000 ? m : null;
}

/** "25:30", "1:02:05", or plain minutes "45" → seconds; invalid → null */
export function parseDurationInput(value: string) {
  const v = value.trim();
  if (/^\d{1,4}$/.test(v)) {
    const s = Number(v) * 60;
    return s > 0 && s <= 172_800 ? s : null;
  }
  const m = v.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [h, min, sec] = [Number(m[1] ?? 0), Number(m[2]), Number(m[3])];
  if (min > 59 && m[1] !== undefined) return null;
  if (sec > 59) return null;
  const s = h * 3600 + min * 60 + sec;
  return s > 0 && s <= 172_800 ? s : null;
}

/** Faster than 1:30/km or slower than 30:00/km is almost certainly a typo. */
export function plausiblePace(secondsPerKm: number) {
  return secondsPerKm >= 90 && secondsPerKm <= 1800;
}
