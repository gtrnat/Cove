"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { fieldErrors, registerSchema } from "./schemas";

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = registerSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);

    const { error } = await authClient.signUp.email(parsed.data);
    if (error) {
      setPending(false);
      setFormError(authErrorMessage(error));
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage>{formError}</FormMessage>

      <Field id="name" label="Name">
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          required
        />
        <FieldError id="name-error">{errors.name}</FieldError>
      </Field>

      <Field id="email" label="Email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        <FieldError id="email-error">{errors.email}</FieldError>
      </Field>

      <Field
        id="password"
        label="Password"
        hint={<span className="text-xs text-muted">At least 8 characters</span>}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          aria-invalid={!!errors.password || undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          required
        />
        <FieldError id="password-error">{errors.password}</FieldError>
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
