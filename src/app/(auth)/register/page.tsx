import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Field } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Track spending, training, and protein in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {/* Submission is wired to Better Auth in Phase 2. */}
      <form className="space-y-5" noValidate>
        <Field id="name" label="Name">
          <Input id="name" name="name" autoComplete="name" placeholder="Your name" required />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
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
            required
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
