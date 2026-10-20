import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { RedirectIfSignedIn } from "@/features/auth/redirect-if-signed-in";
import { RegisterForm } from "@/features/auth/register-form";

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
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <RegisterForm />
    </AuthCard>
  );
}
