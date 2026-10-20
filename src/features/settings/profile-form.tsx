"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { fieldErrors, registerSchema } from "@/features/auth/schemas";

const nameSchema = registerSchema.pick({ name: true });

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [nameError, setNameError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSaved(false);

    const parsed = nameSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setNameError(fieldErrors(parsed.error).name);
      return;
    }
    setNameError(undefined);
    setPending(true);
    const { error } = await authClient.updateUser({ name: parsed.data.name });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field id="name" label="Name">
        <Input
          id="name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          aria-invalid={!!nameError || undefined}
          aria-describedby={nameError ? "name-error" : undefined}
        />
        <FieldError id="name-error">{nameError}</FieldError>
      </Field>
      <Field id="email" label="Email">
        <Input id="email" value={email} readOnly disabled aria-describedby="email-hint" />
        <p id="email-hint" className="text-xs text-muted">
          Email changes aren&apos;t available yet.
        </p>
      </Field>
      <FormMessage>{error}</FormMessage>
      <FormMessage tone="success">{saved ? "Profile updated." : undefined}</FormMessage>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending && <Spinner />}
        Save profile
      </Button>
    </form>
  );
}
