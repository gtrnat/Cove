import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native select styled to match Input. Native keeps keyboard and mobile pickers for free. */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-border-strong bg-surface pl-3 pr-9 text-sm text-foreground",
          "transition-colors duration-150 hover:border-faint",
          "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
