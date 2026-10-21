"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteFoodLog } from "./actions";
import { AddFoodDialog } from "./add-food-dialog";
import { mealLabels, meals, round1, type Meal } from "./math";
import type { DayLogEntry, RecentFood } from "./queries";

function formatQuantity(q: number, label: string) {
  const n = Number.isInteger(q) ? q : round1(q);
  return label === "g" ? `${n} g` : `${n} ${label.replace(/\s*\(.*\)$/, "")}`;
}

export function FoodLogBoard({
  day,
  entries,
  recent,
  suggestedMeal,
  autoAdd,
}: {
  day: string;
  entries: DayLogEntry[];
  recent: RecentFood[];
  suggestedMeal: Meal;
  /** Open the add-food dialog on mount (quick add). */
  autoAdd?: boolean;
}) {
  const [adding, setAdding] = useState<Meal | null>(autoAdd ? suggestedMeal : null);

  useEffect(() => {
    if (!autoAdd) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("add");
    window.history.replaceState(null, "", url);
  }, [autoAdd]);

  return (
    <div className="space-y-4">
      {meals.map((meal) => {
        const items = entries.filter((e) => e.meal === meal);
        const protein = round1(items.reduce((s, e) => s + e.proteinG, 0));
        return (
          <section key={meal} aria-labelledby={`meal-${meal}`} className="rounded-lg border bg-surface">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <h2 id={`meal-${meal}`} className="text-sm font-medium">
                {mealLabels[meal]}
                {items.length > 0 && <span className="tabular ml-2 text-xs font-normal text-muted">{protein} g</span>}
              </h2>
              <Button
                variant={meal === suggestedMeal && items.length === 0 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setAdding(meal)}
                aria-label={`Add food to ${mealLabels[meal].toLowerCase()}`}
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
            </div>
            {items.length > 0 && (
              <ul className="divide-y border-t">
                {items.map((e) => (
                  <EntryRow key={e.id} entry={e} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <AddFoodDialog
        open={adding !== null}
        onClose={() => setAdding(null)}
        day={day}
        meal={adding ?? suggestedMeal}
        recent={recent}
      />
    </div>
  );
}

function EntryRow({ entry }: { entry: DayLogEntry }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 px-4 py-2.5" aria-busy={pending || undefined}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{entry.name}</p>
        <p className="tabular text-xs text-muted">
          {formatQuantity(entry.quantity, entry.unitLabel)}
          {entry.unitLabel !== "g" ? ` · ${round1(entry.grams)} g` : ""}
          {entry.calories !== null ? ` · ${Math.round(entry.calories)} kcal` : ""}
        </p>
      </div>
      <p className="tabular text-sm">{entry.proteinG} g</p>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-faint hover:text-muted"
        disabled={pending}
        onClick={() => startTransition(() => deleteFoodLog(entry.id))}
        aria-label={`Remove ${entry.name}`}
      >
        <X aria-hidden="true" />
      </Button>
    </li>
  );
}
