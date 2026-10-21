import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { AccountCard, AccountCardSkeleton } from "@/features/auth/account-card";
import { ActiveBottomLinks, ActiveSidebarLinks } from "./active-nav";
import { CommandMenuTrigger } from "./command-menu";
import { BottomLinks, SidebarLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" aria-label="Cove dashboard" className="rounded-md">
          <Logo />
        </Link>
      </div>

      <div className="px-3 pb-2">
        <CommandMenuTrigger />
      </div>

      <nav aria-label="Main" className="flex-1 px-3 pt-2">
        <Suspense fallback={<SidebarLinks pathname={null} />}>
          <ActiveSidebarLinks />
        </Suspense>
      </nav>

      <div className="border-t p-3">
        <Suspense fallback={<AccountCardSkeleton />}>
          <AccountCard />
        </Suspense>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 pl-5 pr-3 backdrop-blur-md md:hidden">
      <Link href="/dashboard" aria-label="Cove dashboard" className="rounded-md">
        <Logo />
      </Link>
      <CommandMenuTrigger compact />
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
