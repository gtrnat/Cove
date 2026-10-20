import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  /** Short context line under the value, e.g. "of Rp 5.000.000 budget". */
  hint?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
  children,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted">{label}</p>
        {Icon && (
          <Icon aria-hidden="true" strokeWidth={1.75} className="size-4 text-faint" />
        )}
      </div>
      <p className="tabular mt-3 text-[28px] font-medium leading-none text-foreground">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
