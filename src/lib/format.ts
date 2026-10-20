/*
 * Display formatting. UI copy is English, but money uses Indonesian grouping
 * ("Rp 12.000") because amounts are rupiah.
 */

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const idrCompact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 12000 → "Rp 12.000" (regular space instead of NBSP for predictable layout) */
export function formatIDR(amount: number) {
  return idr.format(amount).replace(/\u00a0/g, " ");
}

/** 2450000 → "Rp 2,5 jt" */
export function formatIDRCompact(amount: number) {
  return `Rp ${idrCompact.format(amount)}`;
}

/** 12000 → "12.000" for amount inputs */
export function formatAmountInput(amount: number) {
  return amount.toLocaleString("id-ID");
}

/** Signed amount for lists: "−Rp 12.000" / "+Rp 5.000.000" */
export function formatSignedIDR(amount: number, type: "expense" | "income") {
  return `${type === "expense" ? "−" : "+"}${formatIDR(amount)}`;
}

/** Percentage change, or null when there's no baseline. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
