import { Suspense } from "react";
import type { SubNavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { ActiveTabLinks } from "./active-nav";
import { TabLinks } from "./nav-links";

type PageHeaderProps = {
  /** Can include streamed parts (e.g. a <Suspense>'d greeting). */
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  tabs?: SubNavItem[];
  /** Accessible name for the tab nav. Required when title isn't a plain string. */
  tabsLabel?: string;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  tabs,
  tabsLabel,
  className,
}: PageHeaderProps) {
  const navLabel = tabsLabel ?? (typeof title === "string" ? `${title} sections` : "Sections");

  return (
    <header className={cn("mb-8", tabs && "border-b", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {tabs && (
        <nav aria-label={navLabel} className="mt-6">
          <Suspense fallback={<TabLinks items={tabs} pathname={null} />}>
            <ActiveTabLinks items={tabs} />
          </Suspense>
        </nav>
      )}
    </header>
  );
}
