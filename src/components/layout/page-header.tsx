import { Suspense } from "react";
import type { SubNavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { ActiveTabLinks } from "./active-nav";
import { TabLinks } from "./nav-links";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tabs?: SubNavItem[];
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  tabs,
  className,
}: PageHeaderProps) {
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
        <nav aria-label={`${title} sections`} className="mt-6">
          <Suspense fallback={<TabLinks items={tabs} pathname={null} />}>
            <ActiveTabLinks items={tabs} />
          </Suspense>
        </nav>
      )}
    </header>
  );
}
