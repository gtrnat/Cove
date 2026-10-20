import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type FormMessageProps = {
  tone?: "error" | "success";
  children?: React.ReactNode;
  className?: string;
};

/**
 * Inline status line for forms. Always rendered (empty when idle) so the
 * live region exists before the message arrives and screen readers announce it.
 */
export function FormMessage({ tone = "error", children, className }: FormMessageProps) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div role={tone === "error" ? "alert" : "status"} aria-live="polite" className={className}>
      {children ? (
        <p
          className={cn(
            "flex items-start gap-2 rounded-md px-3 py-2.5 text-sm",
            tone === "error" ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive",
          )}
        >
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{children}</span>
        </p>
      ) : null}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-xs text-negative">
      {children}
    </p>
  );
}
