import { Suspense } from "react";
import { MobileHeader, MobileNav, Sidebar } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { SessionGate } from "@/features/auth/session-gate";

/*
 * Signed-in app shell. The shell (sidebar, nav) is static and prerendered;
 * page content streams in behind the session check.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-60">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileHeader />
      <main
        id="content"
        className="mx-auto max-w-[1200px] px-5 pb-28 pt-8 md:px-10 md:pb-16 md:pt-12"
      >
        <Suspense fallback={<PageSkeleton />}>
          <SessionGate>{children}</SessionGate>
        </Suspense>
      </main>
      <MobileNav />
    </div>
  );
}
