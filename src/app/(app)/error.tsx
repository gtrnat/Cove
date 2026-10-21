"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";

/** Shown inside the app shell when a page throws, so navigation stays usable. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";

  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-20 text-center">
      <LogoMark className="size-8 opacity-60" />
      <h1 className="mt-6 text-lg font-semibold">Something went wrong on this page.</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        It might be a hiccup with the connection or the database. Your data is safe. Try again, or head back to the
        dashboard.
      </p>
      {digest && <p className="tabular mt-3 text-xs text-faint">Reference: {digest}</p>}
      <div className="mt-8 flex gap-2">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          Dashboard
        </Link>
        <Button onClick={() => retry()}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  );
}
