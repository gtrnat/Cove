import { Suspense } from "react";
import { MobileHeader, MobileNav, Sidebar } from "@/components/layout/app-shell";
import { SessionCheck } from "@/features/auth/session-check";;

/*
 * Signed-in app shell. Everything here is static so it prerenders.
 *
 * Pages are rendered directly, not wrapped in a Suspense'd session gate:
 * client navigations only re-render below this layout, so a boundary here
 * can't cover them and the navigation would block on the session query.
 * Each page streams its own user data behind its own <Suspense>.
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
      <Suspense fallback={null}>
        <SessionCheck />
      </Suspense>
      <Sidebar />
      <MobileHeader />
      <main
        id="content"
        className="mx-auto max-w-[1200px] px-5 pb-28 pt-8 md:px-10 md:pb-16 md:pt-12"
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
