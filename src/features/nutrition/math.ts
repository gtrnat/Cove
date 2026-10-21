/** Pure nutrition helpers, shared by server, client, and tests. No imports. */

export const meals = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof meals)[number];

export const mealLabels: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

/** Sensible default meal for a local hour (0-23). */
export function mealForHour(hour: number): Meal {
  if (hour >= 4 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "snack";
}

/** 3 pieces × 55 g × 12.6 g/100 g → 20.8 g */
export function nutrientFor(quantity: number, gramsPerUnit: number, per100g: number) {
  return (quantity * gramsPerUnit * per100g) / 100;
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** "g" → "g", ("piece", 55) → "piece (55 g)" */
export function unitText(label: string, grams: number) {
  return label === "g" ? "g" : `${label} (${round1(grams)} g)`;
}

/** "Telur Ayam (Rebus)!" → "telur ayam rebus" */
export function normalizeFoodName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function bigrams(s: string) {
  const padded = ` ${s} `;
  const out = new Map<string, number>();
  for (let i = 0; i < padded.length - 1; i++) {
    const g = padded.slice(i, i + 2);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

/** Dice coefficient over character bigrams, 0..1. Word order is ignored. */
export function nameSimilarity(a: string, b: string) {
  const x = normalizeFoodName(a).split(" ").sort().join(" ");
  const y = normalizeFoodName(b).split(" ").sort().join(" ");
  if (!x || !y) return 0;
  if (x === y) return 1;
  const A = bigrams(x);
  const B = bigrams(y);
  let overlap = 0;
  let total = 0;
  for (const [g, n] of A) {
    overlap += Math.min(n, B.get(g) ?? 0);
    total += n;
  }
  for (const n of B.values()) total += n;
  return (2 * overlap) / total;
}

/**
 * Rough plausibility for user-entered macros per 100 g. Calories from macros
 * (4/4/9 kcal per g) shouldn't exceed stated calories by much.
 */
export function macrosPlausible(p: {
  protein: number;
  carbs: number | null;
  fat: number | null;
  calories: number | null;
}) {
  const grams = p.protein + (p.carbs ?? 0) + (p.fat ?? 0);
  if (grams > 100.5) return "Protein, carbs, and fat add up to more than 100 g per 100 g.";
  if (p.calories !== null) {
    const fromMacros = p.protein * 4 + (p.carbs ?? 0) * 4 + (p.fat ?? 0) * 9;
    if (fromMacros > p.calories * 1.25 + 20) return "These macros don't fit the calories. Double-check the label.";
    if (p.calories > 900) return "More than 900 kcal per 100 g isn't possible.";
  }
  return null;
}
