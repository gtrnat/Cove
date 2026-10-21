import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { env } from "@/env";
import { RedirectIfSignedIn } from "@/features/auth/redirect-if-signed-in";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  // Read at build time; changing ALLOW_REGISTRATION on Vercel needs a redeploy (which env changes do anyway).
  const open = env.ALLOW_REGISTRATION;

  return (
    <AuthCard
      title="Create your account"
      description={
        open
          ? "Track spending, training, and protein in one place."
          : "This Cove is invite-only right now. If you're the owner, register with your admin email."
      }
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
