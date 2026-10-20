import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-8" />
      <p className="tabular mt-8 text-sm text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">This page drifted off.</h1>
      <p className="mt-2 text-sm text-muted">The link may be broken or the page may have moved.</p>
      <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
        Back to Cove
      </Link>
    </main>
  );
}
