import { cn } from "@/lib/utils";

/** Placeholder with the footprint of a stacked form: label + input rows and a button. */
export function FormSkeleton({
  fields,
  buttonClassName,
  className,
}: {
  fields: number;
  buttonClassName?: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse space-y-5", className)}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded bg-surface-2" />
          <div className="h-10 rounded-md border border-border-strong bg-surface" />
        </div>
      ))}
      <div className={cn("h-9 w-32 rounded-md bg-surface-2", buttonClassName)} />
    </div>
  );
}
