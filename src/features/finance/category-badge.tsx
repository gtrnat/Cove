import { createElement } from "react";
import { cn } from "@/lib/utils";
import { categoryIcon, UNCATEGORIZED_COLOR } from "./icons";

/** Round icon tile tinted with the category color. */
export function CategoryIcon({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const c = color ?? UNCATEGORIZED_COLOR;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        size === "md" ? "size-9" : "size-7",
        className,
      )}
      style={{ backgroundColor: `${c}1f`, color: c }}
    >
      {/* Icons come from a static module-level map, so looking one up per render is safe. */}
      {createElement(categoryIcon(icon), {
        strokeWidth: 1.75,
        className: size === "md" ? "size-4" : "size-3.5",
      })}
    </span>
  );
}
