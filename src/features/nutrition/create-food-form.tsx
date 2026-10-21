"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { createFood, similarFoodsAction } from "./actions";
import type { FoodWithUnits } from "./queries";

type Similar = Awaited<ReturnType<typeof similarFoodsAction>>[number];

const num = (v: string) => {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Adds a community food. Shows likely duplicates while typing so people pick
 * an existing food instead of creating another copy.
 */
export function CreateFoodForm({
  initialName = "",
  onCreated,
  onPickExisting,
  onCancel,
}: {
  initialName?: string;
  onCreated: (food: FoodWithUnits) => void;
  /** Called with a food id when the user picks a suggested duplicate. */
  onPickExisting?: (id: string, name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState("");
  const [basis, setBasis] = useState<"100g" | "serving">("100g");
  const [servingLabel, setServingLabel] = useState("serving");
  const [servingGrams, setServingGrams] = useState("");
  const [protein, setProtein] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [similar, setSimilar] = useState<Similar[]>([]);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (name.trim().length < 3) return;
    const id = setTimeout(() => {
      similarFoodsAction(name).then(setSimilar);
    }, 350);
    return () => clearTimeout(id);
  }, [name]);
  const shownSimilar = name.trim().length < 3 ? [] : similar;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    const values = { protein: num(protein), calories: num(calories), carbs: num(carbs), fat: num(fat) };
    if (values.protein === null || Number.isNaN(values.protein)) return setError("Enter the protein amount.");
    if ([values.calories, values.carbs, values.fat].some((v) => Number.isNaN(v))) return setError("Use numbers only.");
    const grams = num(servingGrams);
    if (basis === "serving" && (grams === null || Number.isNaN(grams) || grams <= 0)) {
      return setError("Enter how many grams one serving weighs.");
    }

    startTransition(async () => {
      const res = await createFood({
        name,
        brand: brand || null,
        basis,
        servingLabel: basis === "serving" ? servingLabel : null,
        servingGrams: basis === "serving" ? grams : null,
        ...values,
      });
      if (res.ok) onCreated(res.food);
      else setError(res.message);
    });
  }

  const per = basis === "100g" ? "per 100 g" : `per ${servingLabel || "serving"}`;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <Field id="nf-name" label="Name">
          <Input id="nf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus placeholder="e.g. Ayam penyet" />
        </Field>
        <Field id="nf-brand" label="Brand" hint={<span className="text-xs text-muted">Optional</span>}>
          <Input id="nf-brand" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={60} />
        </Field>
      </div>

      {shownSimilar.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3" role="status">
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle aria-hidden="true" className="size-4 text-warning" />
            Similar foods already exist
          </p>
          <ul className="mt-2 space-y-1">
            {shownSimilar.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {s.name}
                  {s.brand && <span className="text-muted"> · {s.brand}</span>}{" "}
                  <span className="tabular text-xs text-muted">{s.proteinPer100g} g protein/100 g</span>
                </span>
                {onPickExisting && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onPickExisting(s.id, s.name)}>
                    Use this
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Segmented
        name="basis"
        legend="Nutrition values are"
        value={basis}
        onChange={setBasis}
        options={[
          { value: "100g", label: "Per 100 g" },
          { value: "serving", label: "Per serving" },
        ]}
      />

      {basis === "serving" && (
        <div className="grid grid-cols-2 gap-4">
          <Field id="nf-serving" label="Serving name">
            <Input id="nf-serving" value={servingLabel} onChange={(e) => setServingLabel(e.target.value)} maxLength={30} placeholder="bar, piece, bowl" />
          </Field>
          <Field id="nf-grams" label="Weight of one serving" hint={<span className="text-xs text-muted">g</span>}>
            <Input id="nf-grams" inputMode="decimal" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)} className="tabular" />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field id="nf-protein" label="Protein" hint={<span className="text-xs text-muted">g</span>}>
          <Input id="nf-protein" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} className="tabular" />
        </Field>
        <Field id="nf-kcal" label="Calories" hint={<span className="text-xs text-muted">kcal</span>}>
          <Input id="nf-kcal" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} className="tabular" placeholder="—" />
        </Field>
        <Field id="nf-carbs" label="Carbs" hint={<span className="text-xs text-muted">g</span>}>
          <Input id="nf-carbs" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="tabular" placeholder="—" />
        </Field>
        <Field id="nf-fat" label="Fat" hint={<span className="text-xs text-muted">g</span>}>
          <Input id="nf-fat" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className="tabular" placeholder="—" />
        </Field>
      </div>
      <p className="text-xs text-muted">
        Values {per}. New foods are shared with everyone on Cove as <Badge>Community</Badge>.
      </p>

      <FormMessage>{error}</FormMessage>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Back
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Add food
        </Button>
      </div>
    </form>
  );
}
