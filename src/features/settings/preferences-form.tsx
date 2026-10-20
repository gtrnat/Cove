"use client";

import { useActionState } from "react";
import { Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { updatePreferences } from "./actions";
import { timezones } from "./defaults";
import type { ActionState } from "./schemas";

type PreferencesFormProps = {
  dailyProteinTargetG: number | null;
  monthlyBudget: number | null;
  timezone: string;
};

const initialState: ActionState = { status: "idle" };

export function PreferencesForm(props: PreferencesFormProps) {
  const [state, action, pending] = useActionState(updatePreferences, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <Field
        id="dailyProteinTargetG"
        label="Daily protein target"
        hint={<span className="text-xs text-muted">grams</span>}
      >
        <Input
          id="dailyProteinTargetG"
          name="dailyProteinTargetG"
          inputMode="numeric"
          placeholder="e.g. 140"
          defaultValue={props.dailyProteinTargetG ?? ""}
          aria-invalid={!!errors.dailyProteinTargetG || undefined}
          aria-describedby={errors.dailyProteinTargetG ? "protein-error" : "protein-hint"}
          className="tabular"
        />
        <FieldError id="protein-error">{errors.dailyProteinTargetG}</FieldError>
        {!errors.dailyProteinTargetG && (
          <p id="protein-hint" className="text-xs text-muted">
            A common starting point is 1.6–2.2 g per kg of body weight.
          </p>
        )}
      </Field>

      <Field id="monthlyBudget" label="Monthly budget" hint={<span className="text-xs text-muted">Rp</span>}>
        <Input
          id="monthlyBudget"
          name="monthlyBudget"
          inputMode="numeric"
          placeholder="e.g. 5.000.000"
          defaultValue={props.monthlyBudget?.toLocaleString("id-ID") ?? ""}
          aria-invalid={!!errors.monthlyBudget || undefined}
          aria-describedby={errors.monthlyBudget ? "budget-error" : undefined}
          className="tabular"
        />
        <FieldError id="budget-error">{errors.monthlyBudget}</FieldError>
      </Field>

      <Field id="timezone" label="Timezone">
        <Select
          id="timezone"
          name="timezone"
          defaultValue={props.timezone}
          aria-invalid={!!errors.timezone || undefined}
          aria-describedby={errors.timezone ? "timezone-error" : "timezone-hint"}
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
        <FieldError id="timezone-error">{errors.timezone}</FieldError>
        {!errors.timezone && (
          <p id="timezone-hint" className="text-xs text-muted">
            Used to decide which day a transaction, workout, or meal belongs to.
          </p>
        )}
      </Field>

      <FormMessage tone={state.status === "success" ? "success" : "error"}>
        {state.status !== "idle" && !pending ? state.message : undefined}
      </FormMessage>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending && <Spinner />}
        Save preferences
      </Button>
    </form>
  );
}
