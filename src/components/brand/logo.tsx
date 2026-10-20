import { cn } from "@/lib/utils";

/** Cove mark: an open arc (the cove) holding a single wave. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 text-accent", className)}
    >
      <path
        d="M18.5 6.2A8.5 8.5 0 1 0 18.5 17.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.2 13.2c1.25-1.1 2.55-1.1 3.8 0s2.55 1.1 3.8 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
        Cove
      </span>
    </span>
  );
}
