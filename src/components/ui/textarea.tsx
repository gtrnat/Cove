import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full resize-y rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground",
        "placeholder:text-faint",
        "transition-colors duration-150 hover:border-faint",
        "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
        "aria-invalid:border-negative",
        className,
      )}
      {...props}
    />
  );
}
