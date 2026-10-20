import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** Radio group styled as a segmented control. Native radios keep keyboard (arrow keys) behavior. */
export function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <fieldset className={className}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg border border-border-strong bg-background p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "relative flex h-8 cursor-pointer items-center justify-center rounded-md text-sm transition-colors",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
              value === o.value ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
