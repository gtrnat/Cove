"use client";

import { GitMerge, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { searchFoodsAction } from "./actions";
import { addFoodUnit, deleteFood, deleteFoodUnit, mergeFoods, updateFood } from "./admin-actions";
import { unitText } from "./math";
import type { FoodWithUnits } from "./queries";

export type AdminFood = FoodWithUnits & { usageCount: number; creatorName: string | null };

const toNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export function AdminFoodEditor({ food }: { food: AdminFood }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`Edit ${food.name}`}>
        <Pencil aria-hidden="true" />
        Edit
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Edit ${food.name}`} className="max-w-xl">
        <EditorBody food={food} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function EditorBody({ food, onClose }: { food: AdminFood; onClose: () => void }) {
  const [form, setForm] = useState({
    name: food.name,
    brand: food.brand ?? "",
    protein: String(food.proteinPer100g),
    calories: food.caloriesPer100g === null ? "" : String(food.caloriesPer100g),
    carbs: food.carbsPer100g === null ? "" : String(food.carbsPer100g),
    fat: food.fatPer100g === null ? "" : String(food.fatPer100g),
    status: food.status,
  });
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string }>();
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  function save() {
    startTransition(async () => {
      const res = await updateFood(food.id, {
        name: form.name,
        brand: form.brand || null,
        proteinPer100g: toNum(form.protein) ?? NaN,
        caloriesPer100g: toNum(form.calories),
        carbsPer100g: toNum(form.carbs),
        fatPer100g: toNum(form.fat),
        status: form.status,
      });
      setMessage(res.ok ? { tone: "success", text: res.message ?? "Saved." } : { tone: "error", text: res.message });
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">
        Logged {food.usageCount} {food.usageCount === 1 ? "time" : "times"}
        {food.creatorName ? ` · added by ${food.creatorName}` : ""}
      </p>

      <section className="space-y-4" aria-label="Details">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field id="ad-name" label="Name">
            <Input id="ad-name" value={form.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} />
          </Field>
          <Field id="ad-brand" label="Brand">
            <Input id="ad-brand" value={form.brand} onChange={(e) => set({ brand: e.target.value })} maxLength={60} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              ["protein", "Protein g"],
              ["calories", "kcal"],
              ["carbs", "Carbs g"],
              ["fat", "Fat g"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} id={`ad-${key}`} label={label}>
              <Input id={`ad-${key}`} inputMode="decimal" value={form[key]} onChange={(e) => set({ [key]: e.target.value })} className="tabular" />
            </Field>
          ))}
          <Field id="ad-status" label="Status">
            <Select id="ad-status" value={form.status} onChange={(e) => set({ status: e.target.value as "verified" | "community" })}>
              <option value="verified">Verified</option>
              <option value="community">Community</option>
            </Select>
          </Field>
        </div>
        <p className="text-xs text-muted">Per 100 g. Changes apply to new log entries; past entries keep their values.</p>
        <FormMessage tone={message?.tone}>{message?.text}</FormMessage>
        <Button onClick={save} disabled={pending}>
          {pending && <Spinner />}
          Save details
        </Button>
      </section>

      <UnitsSection food={food} />
      <MergeSection food={food} onMerged={onClose} />
      <DeleteSection food={food} onDeleted={onClose} />
    </div>
  );
}

function UnitsSection({ food }: { food: AdminFood }) {
  const [label, setLabel] = useState("");
  const [grams, setGrams] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <section aria-labelledby="ad-units" className="space-y-3 border-t pt-5">
      <h3 id="ad-units" className="text-sm font-medium">
        Units
      </h3>
      <ul className="flex flex-wrap gap-2">
        {food.units.map((u) => (
          <li key={u.id} className="inline-flex items-center gap-1 rounded-full border bg-background py-1 pl-3 pr-1 text-xs">
            {unitText(u.label, u.gramsPerUnit)}
            {u.isDefault && <span className="text-accent">· default</span>}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteFoodUnit(u.id);
                  setError(res.ok ? undefined : res.message);
                })
              }
              aria-label={`Remove unit ${u.label}`}
              className="grid size-5 place-items-center rounded-full text-faint hover:bg-surface-3 hover:text-muted"
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-end gap-2">
        <Field id="ad-unit-label" label="Unit" className="flex-1 space-y-2">
          <Input id="ad-unit-label" placeholder="piece, slice, cup" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} />
        </Field>
        <Field id="ad-unit-grams" label="Grams" className="w-28 space-y-2">
          <Input id="ad-unit-grams" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} className="tabular" />
        </Field>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await addFoodUnit(food.id, label, toNum(grams) ?? NaN);
              if (res.ok) {
                setLabel("");
                setGrams("");
                setError(undefined);
              } else setError(res.message);
            })
          }
        >
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>
      <FormMessage>{error}</FormMessage>
    </section>
  );
}

function MergeSection({ food, onMerged }: { food: AdminFood; onMerged: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoodWithUnits[]>([]);
  const [target, setTarget] = useState<FoodWithUnits | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) return;
    const id = setTimeout(() => searchFoodsAction(q).then((r) => setResults(r.filter((f) => f.id !== food.id))), 250);
    return () => clearTimeout(id);
  }, [q, food.id]);

  return (
    <section aria-labelledby="ad-merge" className="space-y-3 border-t pt-5">
      <h3 id="ad-merge" className="text-sm font-medium">
        Merge into another food
      </h3>
      <p className="text-xs text-muted">Use this for duplicates. Logs and units move to the food you pick, then this one is removed.</p>
      {target ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
          <GitMerge aria-hidden="true" className="size-4 text-faint" />
          <span className="min-w-0 flex-1 truncate">
            Into <strong className="font-medium">{target.name}</strong>
            {target.brand ? ` · ${target.brand}` : ""} ({target.proteinPer100g} g/100 g)
          </span>
          <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>
            Change
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await mergeFoods(food.id, target.id);
                if (res.ok) onMerged();
                else setError(res.message);
              })
            }
          >
            {pending && <Spinner />}
            Merge
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input type="search" aria-label="Find the food to keep" placeholder="Find the food to keep" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          {q.trim().length >= 2 && results.length > 0 && (
            <ul className="max-h-40 overflow-y-auto rounded-lg border bg-background">
              {results.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setTarget(r)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2">
                    <span className="truncate">
                      {r.name}
                      {r.brand && <span className="text-muted"> · {r.brand}</span>}
                    </span>
                    {r.status === "verified" ? <Badge variant="accent">Verified</Badge> : <Badge>Community</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <FormMessage>{error}</FormMessage>
    </section>
  );
}

function DeleteSection({ food, onDeleted }: { food: AdminFood; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <section aria-label="Delete" className="flex items-center justify-between gap-3 border-t pt-5">
      <p className="text-xs text-muted">Deleting keeps existing log entries but removes the food from search.</p>
      {confirming ? (
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteFood(food.id);
              onDeleted();
            })
          }
        >
          {pending ? <Spinner /> : <Trash2 aria-hidden="true" />}
          Confirm delete
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="text-muted" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden="true" />
          Delete food
        </Button>
      )}
    </section>
  );
}
