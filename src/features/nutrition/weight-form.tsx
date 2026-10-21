"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { saveWeight } from "./actions";

export function WeightForm({ day, current }: { day: string; current: number | null }) {
  const [value, setValue] = useState(current === null ? "" : String(current));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const kg = Number(value.replace(",", "."));
        if (!Number.isFinite(kg) || kg <= 0) return setError("Enter your weight in kg.");
        setError(undefined);
        startTransition(async () => {
          const res = await saveWeight({ day, weightKg: Math.round(kg * 100) / 100 });
          if (res.ok) setSaved(true);
          else setError(res.message);
        });
      }}
    >
      <label htmlFor="weight-input" className="text-[13px] font-medium">
        Weight on this day
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="weight-input"
            inputMode="decimal"
            placeholder="e.g. 72.4"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="tabular pr-10"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">kg</span>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending && <Spinner />}
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
      <FormMessage>{error}</FormMessage>
    </form>
  );
}
