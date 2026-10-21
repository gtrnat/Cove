"use client";

import { ArrowRight, Trash2, Wand2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, invalidProps } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CategoryIcon } from "./category-badge";
import { applyRulesToUncategorized, deleteRule, saveRule } from "./rule-actions";
import type { FormState } from "./schemas";

export type RuleRow = {
  id: string;
  pattern: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  archived: boolean;
};

type CategoryOption = { id: string; name: string };

const idle: FormState = { status: "idle" };

export function RulesManager({
  rules,
  categories,
  uncategorized,
}: {
  rules: RuleRow[];
  categories: CategoryOption[];
  uncategorized: number;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="mb-3 text-[15px] font-medium">
          Your rules
        </h2>
        {rules.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted">
            No rules yet. Add one to start sorting imported receipts automatically.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-surface">
            {rules.map((r) => (
              <RuleItem key={r.id} rule={r} />
            ))}
          </ul>
        )}
        <ApplyRules uncategorized={uncategorized} disabled={rules.length === 0} />
      </section>

      <section aria-labelledby="new-rule-heading">
        <h2 id="new-rule-heading" className="mb-3 text-[15px] font-medium">
          New rule
        </h2>
        <NewRuleForm categories={categories} />
      </section>
    </div>
  );
}

function NewRuleForm({ categories }: { categories: CategoryOption[] }) {
  const [state, action, pending] = useActionState(saveRule, idle);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border bg-surface p-5" noValidate>
      <Field
        id="rule-pattern"
        label="If the merchant contains"
        error={errors.pattern}
      >
        <Input
          id="rule-pattern"
          name="pattern"
          placeholder="e.g. GOPAY"
          autoComplete="off"
          maxLength={60}
          className="uppercase placeholder:normal-case"
          {...invalidProps("rule-pattern", errors.pattern)}
        />
      </Field>
      <Field id="rule-category" label="Put it in" error={errors.categoryId}>
        <Select id="rule-category" name="categoryId" defaultValue="" {...invalidProps("rule-category", errors.categoryId)}>
          <option value="" disabled>
            Choose a category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage>{state.status === "error" && !pending ? state.message : undefined}</FormMessage>
      <FormMessage tone="success">{state.status === "success" && !pending ? state.message : undefined}</FormMessage>
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Spinner />}
        Add rule
      </Button>
      <p className="text-xs text-muted">Matching ignores case. When several rules match, the longest text wins.</p>
    </form>
  );
}

function RuleItem({ rule }: { rule: RuleRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className="min-w-0 truncate rounded bg-surface-3 px-2 py-0.5 font-mono text-xs">{rule.pattern}</span>
      <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-faint" />
      <CategoryIcon icon={rule.categoryIcon} color={rule.categoryColor} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm">
        {rule.categoryName}
        {rule.archived && <span className="text-muted"> (archived, inactive)</span>}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={pending}
        onClick={() => startTransition(() => deleteRule(rule.id))}
        aria-label={`Delete rule ${rule.pattern}`}
      >
        {pending ? <Spinner /> : <Trash2 aria-hidden="true" />}
      </Button>
    </li>
  );
}

function ApplyRules({ uncategorized, disabled }: { uncategorized: number; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();

  if (uncategorized === 0 && !message) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {uncategorized > 0 && (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending || disabled}
          onClick={() =>
            startTransition(async () => {
              const { updated } = await applyRulesToUncategorized();
              setMessage(updated === 0 ? "No uncategorized expenses matched." : `Categorized ${updated} ${updated === 1 ? "expense" : "expenses"}.`);
            })
          }
        >
          {pending ? <Spinner /> : <Wand2 aria-hidden="true" />}
          Apply to {uncategorized} uncategorized {uncategorized === 1 ? "expense" : "expenses"}
        </Button>
      )}
      <p role="status" className="text-sm text-muted">
        {message}
      </p>
    </div>
  );
}
