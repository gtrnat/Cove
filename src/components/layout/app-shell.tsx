import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { ActiveBottomLinks, ActiveSidebarLinks } from "./active-nav";
import { BottomLinks, SidebarLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" aria-label="Cove dashboard" className="rounded-md">
          <Logo />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3 pt-2">
        <Suspense fallback={<SidebarLinks pathname={null} />}>
          <ActiveSidebarLinks />
        </Suspense>
      </nav>

      {/* Account area. Wired to the signed-in user in Phase 2. */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-surface-3 text-xs font-medium text-muted"
          >
            ·
          </div>
          <div className="min-w-0 text-sm">
            <p className="truncate text-foreground">Guest</p>
            <p className="truncate text-xs text-muted">Not signed in</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/80 px-5 backdrop-blur-md md:hidden">
      <Link href="/dashboard" aria-label="Cove dashboard" className="rounded-md">
        <Logo />
      </Link>
    </header>
  );
}

export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <Suspense fallback={<BottomLinks pathname={null} />}>
        <ActiveBottomLinks />
      </Suspense>
    </nav>
  );
}
