"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatAmountInput } from "@/lib/format";
import { setCategoryBudget } from "./budget-actions";

/** Inline "set / edit / clear" control for one category's monthly budget. */
export function BudgetEditor({ categoryId, name, budget }: { categoryId: string; name: string; budget: number | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(budget ? formatAmountInput(budget) : "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label={`${budget ? "Edit" : "Set"} budget for ${name}`}>
        <Pencil aria-hidden="true" />
        {budget ? "Edit" : "Set"}
      </Button>
    );
  }

  function save(amount: number | null) {
    startTransition(async () => {
      const res = await setCategoryBudget(categoryId, amount);
      if (res.ok) {
        setEditing(false);
        setError(undefined);
      } else setError(res.message);
    });
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const digits = value.replace(/\D/g, "");
        if (!digits) return save(null);
        save(Number(digits));
      }}
    >
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">Rp</span>
        <Input
          aria-label={`Monthly budget for ${name}`}
          aria-invalid={error ? true : undefined}
          title={error}
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const d = value.replace(/\D/g, "");
            if (d) setValue(formatAmountInput(Number(d)));
          }}
          className="tabular h-8 w-36 pl-8"
        />
      </div>
      <Button type="submit" size="icon" className="size-8" disabled={pending} aria-label="Save budget">
        {pending ? <Spinner /> : <Check aria-hidden="true" />}
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setEditing(false)} aria-label="Cancel">
        <X aria-hidden="true" />
      </Button>
      {error && <span role="alert" className="sr-only">{error}</span>}
    </form>
  );
}
