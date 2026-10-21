"use client";

import { ChevronLeft, Plus, Search } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getFoodAction, logFood, searchFoodsAction } from "./actions";
import { CreateFoodForm } from "./create-food-form";
import { mealLabels, meals, nutrientFor, round1, unitText, type Meal } from "./math";
import type { FoodWithUnits, RecentFood } from "./queries";

type Mode =
  | { kind: "search" }
  | { kind: "amount"; food: FoodWithUnits; unitId?: string | null; quantity?: number }
  | { kind: "create"; name: string };

export function AddFoodDialog({
  open,
  onClose,
  day,
  meal,
  recent,
}: {
  open: boolean;
  onClose: () => void;
  day: string;
  meal: Meal;
  recent: RecentFood[];
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Add to ${mealLabels[meal].toLowerCase()}`} className="max-w-lg">
      <AddFoodFlow day={day} meal={meal} recent={recent} onDone={onClose} />
    </Dialog>
  );
}

function AddFoodFlow({ day, meal, recent, onDone }: { day: string; meal: Meal; recent: RecentFood[]; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>({ kind: "search" });
  const [query, setQuery] = useState("");

  if (mode.kind === "create") {
    return (
      <CreateFoodForm
        initialName={mode.name}
        onCancel={() => setMode({ kind: "search" })}
        onCreated={(food) => setMode({ kind: "amount", food })}
        onPickExisting={async (id) => {
          const food = await getFoodAction(id);
          if (food) setMode({ kind: "amount", food });
        }}
      />
    );
  }
  if (mode.kind === "amount") {
    return (
      <AmountForm
        food={mode.food}
        initialUnitId={mode.unitId}
        initialQuantity={mode.quantity}
        day={day}
        meal={meal}
        onBack={() => setMode({ kind: "search" })}
        onDone={onDone}
      />
    );
  }
  return (
    <FoodSearch
      query={query}
      onQuery={setQuery}
      recent={recent}
      onPick={(food, unitId, quantity) => setMode({ kind: "amount", food, unitId, quantity })}
      onCreate={() => setMode({ kind: "create", name: query })}
    />
  );
}

function FoodSearch({
  query,
  onQuery,
  recent,
  onPick,
  onCreate,
}: {
  query: string;
  onQuery: (q: string) => void;
  recent: RecentFood[];
  onPick: (food: FoodWithUnits, unitId?: string | null, quantity?: number) => void;
  onCreate: () => void;
}) {
  const [results, setResults] = useState<FoodWithUnits[]>([]);
  const [searching, startSearch] = useTransition();
  const active = query.trim().length >= 2;

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => startSearch(async () => setResults(await searchFoodsAction(query))), 250);
    return () => clearTimeout(id);
  }, [query, active]);

  const list = active
    ? results.map((food) => ({ food, unitId: undefined, quantity: undefined }))
    : recent.map((r) => ({ food: r.food, unitId: r.lastUnitId, quantity: r.lastQuantity }));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          aria-label="Search foods"
          placeholder="Search eggs, chicken breast, tempe…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
        {searching && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />}
      </div>

      <div className="-mx-2 max-h-[45vh] overflow-y-auto px-2">
        {!active && list.length > 0 && <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted">Recent</h3>}
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {active ? (searching ? "Searching…" : "No foods match.") : "Search for a food to log it."}
          </p>
        ) : (
          <ul>
            {list.map(({ food, unitId, quantity }) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => onPick(food, unitId, quantity)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      {food.name}
                      {food.brand && <span className="text-muted"> · {food.brand}</span>}
                    </span>
                    <span className="tabular text-xs text-muted">{food.proteinPer100g} g protein / 100 g</span>
                  </span>
                  {food.status === "community" && <Badge>Community</Badge>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={onCreate}>
        <Plus aria-hidden="true" />
        {active ? `Can't find it? Add “${query.trim()}”` : "Add a new food"}
      </Button>
    </div>
  );
}

function AmountForm({
  food,
  initialUnitId,
  initialQuantity,
  day,
  meal: initialMeal,
  onBack,
  onDone,
}: {
  food: FoodWithUnits;
  initialUnitId?: string | null;
  initialQuantity?: number;
  day: string;
  meal: Meal;
  onBack: () => void;
  onDone: () => void;
}) {
  const fallbackUnit = food.units.find((u) => u.isDefault) ?? food.units[0];
  const [unitId, setUnitId] = useState(food.units.some((u) => u.id === initialUnitId) ? initialUnitId! : fallbackUnit?.id);
  const unit = food.units.find((u) => u.id === unitId) ?? fallbackUnit;
  const [quantity, setQuantity] = useState(String(initialQuantity ?? (unit?.label === "g" ? 100 : 1)));
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const qty = Number(quantity.replace(",", "."));
  const valid = unit && Number.isFinite(qty) && qty > 0;
  const protein = valid ? round1(nutrientFor(qty, unit.gramsPerUnit, food.proteinPer100g)) : 0;
  const kcal = valid && food.caloriesPer100g !== null ? Math.round(nutrientFor(qty, unit.gramsPerUnit, food.caloriesPer100g)) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError("Enter how much you ate.");
    setError(undefined);
    startTransition(async () => {
      const res = await logFood({ foodId: food.id, unitId: unit.id, quantity: qty, meal, day });
      if (res.ok) onDone();
      else setError(res.message);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft aria-hidden="true" className="size-4" />
        Search
      </button>
      <div>
        <p className="font-medium">
          {food.name}
          {food.brand && <span className="text-muted"> · {food.brand}</span>}
        </p>
        <p className="tabular text-xs text-muted">
          {food.proteinPer100g} g protein
          {food.caloriesPer100g !== null ? ` · ${food.caloriesPer100g} kcal` : ""} per 100 g
          {food.status === "community" ? " · community entry" : ""}
        </p>
      </div>

      <div className="grid grid-cols-[110px_1fr] gap-3">
        <Field id="af-qty" label="Amount">
          <Input
            id="af-qty"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="tabular h-11 text-lg"
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
          />
        </Field>
        <Field id="af-unit" label="Unit">
          <Select
            id="af-unit"
            value={unit?.id}
            className="h-11"
            onChange={(e) => {
              const next = food.units.find((u) => u.id === e.target.value);
              setUnitId(e.target.value);
              // Switching between grams and pieces: pick a sensible amount.
              if (next && unit && (next.label === "g") !== (unit.label === "g")) setQuantity(next.label === "g" ? "100" : "1");
            }}
          >
            {food.units.map((u) => (
              <option key={u.id} value={u.id}>
                {unitText(u.label, u.gramsPerUnit)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field id="af-meal" label="Meal">
        <Select id="af-meal" value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
          {meals.map((m) => (
            <option key={m} value={m}>
              {mealLabels[m]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-baseline justify-between rounded-lg border bg-background px-4 py-3" aria-live="polite">
        <span className="text-sm text-muted">Protein</span>
        <span className="tabular text-2xl font-medium">
          {protein}
          <span className="text-sm text-muted"> g{kcal !== null ? ` · ${kcal} kcal` : ""}</span>
        </span>
      </div>

      <FormMessage>{error}</FormMessage>
      <Button type="submit" className="w-full" size="lg" disabled={pending || !valid}>
        {pending && <Spinner />}
        Add {protein} g protein
      </Button>
    </form>
  );
}
