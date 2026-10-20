import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { FormSkeleton } from "@/components/ui/form-skeleton";
import { LoginForm } from "@/features/auth/login-form";
import { RedirectIfSignedIn } from "@/features/auth/redirect-if-signed-in";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Cove."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      {/* useSearchParams (for ?next=) needs a Suspense boundary. */}
      <Suspense fallback={<FormSkeleton fields={2} buttonClassName="h-11 w-full bg-accent/40" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
