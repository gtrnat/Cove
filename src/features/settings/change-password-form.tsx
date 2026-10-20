"use client";

import { useState } from "react";
import { Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { changePasswordSchema, fieldErrors } from "@/features/auth/schemas";

export function ChangePasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(undefined);
    setSaved(false);

    const parsed = changePasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    form.reset();
    setSaved(true);
  }

  const fields = [
    { id: "currentPassword", label: "Current password", autoComplete: "current-password" },
    { id: "newPassword", label: "New password", autoComplete: "new-password" },
    { id: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {fields.map(({ id, label, autoComplete }) => (
        <Field key={id} id={id} label={label}>
          <Input
            id={id}
            name={id}
            type="password"
            autoComplete={autoComplete}
            aria-invalid={!!errors[id] || undefined}
            aria-describedby={errors[id] ? `${id}-error` : undefined}
          />
          <FieldError id={`${id}-error`}>{errors[id]}</FieldError>
        </Field>
      ))}
      <FormMessage>{formError}</FormMessage>
      <FormMessage tone="success">
        {saved ? "Password changed. Other devices have been signed out." : undefined}
      </FormMessage>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending && <Spinner />}
        Change password
      </Button>
    </form>
  );
}
