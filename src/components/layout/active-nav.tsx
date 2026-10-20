"use client";

import { usePathname } from "next/navigation";
import type { SubNavItem } from "@/config/nav";
import { BottomLinks, SidebarLinks, TabLinks } from "./nav-links";

/*
 * usePathname can suspend under Cache Components on routes with dynamic
 * params, so every consumer below is rendered inside <Suspense> with the
 * matching static component as fallback.
 */

export function ActiveSidebarLinks() {
  return <SidebarLinks pathname={usePathname()} />;
}

export function ActiveBottomLinks() {
  return <BottomLinks pathname={usePathname()} />;
}

export function ActiveTabLinks({ items }: { items: SubNavItem[] }) {
  return <TabLinks items={items} pathname={usePathname()} />;
}
