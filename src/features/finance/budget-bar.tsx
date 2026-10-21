import { cn } from "@/lib/utils";

/** Spending vs a limit. Turns amber at 85% and red once over; marks expected pace for the month. */
export function BudgetBar({
  spent,
  budget,
  label,
  pace,
}: {
  spent: number;
  budget: number;
  label: string;
  /** 0..1 share of the month elapsed; shown as a tick so you can see if you're ahead of plan. */
  pace?: number;
}) {
  const ratio = budget > 0 ? spent / budget : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.round(ratio * 100))}
      aria-valuetext={`${Math.round(ratio * 100)}% used`}
      className="relative h-1.5 overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className={cn("h-full rounded-full", ratio >= 1 ? "bg-negative" : ratio >= 0.85 ? "bg-warning" : "bg-accent")}
        style={{ width: `${Math.min(ratio, 1) * 100}%` }}
      />
      {pace !== undefined && pace > 0 && pace < 1 && (
        <div aria-hidden="true" className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: `${pace * 100}%` }} />
      )}
    </div>
  );
}
