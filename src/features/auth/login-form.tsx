"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { safeNextPath } from "@/lib/safe-redirect";
import { fieldErrors, loginSchema } from "./schemas";

export function LoginForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);

    const { error } = await authClient.signIn.email(parsed.data);
    if (error) {
      setPending(false);
      setFormError(authErrorMessage(error));
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage>{formError}</FormMessage>

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

      <Field id="password" label="Password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password || undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          required
        />
        <FieldError id="password-error">{errors.password}</FieldError>
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
