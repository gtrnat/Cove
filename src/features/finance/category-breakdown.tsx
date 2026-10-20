import Link from "next/link";
import { formatIDR } from "@/lib/format";
import { CategoryIcon } from "./category-badge";
import { UNCATEGORIZED_COLOR } from "./icons";

type Item = {
  id: string | null;
  name: string | null;
  color: string | null;
  icon: string | null;
  total: number;
  n: number;
};

/** Ranked list of categories with proportional bars. Each row links to the filtered list. */
export function CategoryBreakdown({ items, month }: { items: Item[]; month: string }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  if (total === 0) return null;

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const pct = Math.round((item.total / total) * 100);
        const href = `/finance/transactions?month=${month}&type=expense&category=${item.id ?? "none"}`;
        return (
          <li key={item.id ?? "none"}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-2"
            >
              <CategoryIcon icon={item.icon} color={item.color} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{item.name ?? "Uncategorized"}</span>
                  <span className="tabular shrink-0 text-foreground">{formatIDR(item.total)}</span>
                </span>
                <span className="mt-1.5 flex items-center gap-3">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: item.color ?? UNCATEGORIZED_COLOR }}
                    />
                  </span>
                  <span className="tabular w-9 shrink-0 text-right text-xs text-muted">{pct}%</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
