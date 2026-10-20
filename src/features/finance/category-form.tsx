"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, invalidProps } from "@/components/ui/field";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { saveCategory } from "./actions";
import { CategoryIcon } from "./category-badge";
import { categoryColors, categoryIconKeys, categoryIcons } from "./icons";
import type { FormState } from "./schemas";

export type EditableCategory = {
  id: string;
  type: "expense" | "income";
  name: string;
  icon: string;
  color: string;
};

const idle: FormState = { status: "idle" };

export function CategoryForm({
  category,
  defaultType = "expense",
  onDone,
}: {
  category?: EditableCategory;
  defaultType?: "expense" | "income";
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveCategory, idle);
  const [type, setType] = useState(category?.type ?? defaultType);
  const [icon, setIcon] = useState(category?.icon ?? "circle");
  const [color, setColor] = useState(category?.color ?? categoryColors[0]);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-5" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}

      {category ? (
        <input type="hidden" name="type" value={category.type} />
      ) : (
        <Segmented
          name="type"
          legend="Category type"
          value={type}
          onChange={setType}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
      )}

      <div className="flex items-end gap-3">
        <CategoryIcon icon={icon} color={color} className="mb-0.5 size-10" />
        <Field id="cat-name" label="Name" error={errors.name} className="flex-1 space-y-2">
          <Input
            id="cat-name"
            name="name"
            defaultValue={category?.name}
            maxLength={40}
            autoComplete="off"
            autoFocus
            {...invalidProps("cat-name", errors.name)}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {categoryColors.map((c) => (
            <label key={c} className="relative cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
                aria-label={c}
              />
              <span
                className="grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-surface peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check aria-hidden="true" className="size-3.5 text-background" strokeWidth={3} />}
              </span>
            </label>
          ))}
        </div>
        <FieldError id="cat-color-error">{errors.color}</FieldError>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Icon</legend>
        <div className="grid grid-cols-9 gap-1.5">
          {categoryIconKeys.map((key) => {
            const Icon = categoryIcons[key];
            return (
              <label key={key} className="cursor-pointer">
                <input
                  type="radio"
                  name="icon"
                  value={key}
                  checked={icon === key}
                  onChange={() => setIcon(key)}
                  className="peer sr-only"
                  aria-label={key.replace(/-/g, " ")}
                />
                <span
                  className={cn(
                    "grid aspect-square place-items-center rounded-md border transition-colors",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
                    icon === key
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-transparent text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-4" />
                </span>
              </label>
            );
          })}
        </div>
        <FieldError id="cat-icon-error">{errors.icon}</FieldError>
      </fieldset>

      <FormMessage>{state.status === "error" && !pending ? state.message : undefined}</FormMessage>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {category ? "Save changes" : "Add category"}
        </Button>
      </div>
    </form>
  );
}
