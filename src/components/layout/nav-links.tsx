import Link from "next/link";
import { isActive, mainNav, type SubNavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

/*
 * Pure render components. They take the pathname as a prop so the same markup
 * can be used as a static Suspense fallback (pathname = null) and by the
 * client wrappers in active-nav.tsx once the pathname is known.
 */

export function SidebarLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {mainNav.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-accent" : "text-faint group-hover:text-muted",
                )}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="grid grid-cols-4">
      {mainNav.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                active ? "text-foreground" : "text-muted",
              )}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn("size-5", active ? "text-accent" : "text-faint")}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function TabLinks({
  items,
  pathname,
}: {
  items: SubNavItem[];
  pathname: string | null;
}) {
  return (
    <ul className="-mb-px flex gap-6 overflow-x-auto">
      {items.map(({ href, label }, i) => {
        // The first tab is the section root, so it only matches exactly.
        const active = isActive(pathname, href, i === 0);
        return (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center border-b text-sm transition-colors duration-150",
                active
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
