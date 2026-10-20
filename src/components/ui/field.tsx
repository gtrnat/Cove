import { Label } from "./label";
import { FieldError } from "./form-message";

type FieldProps = {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

/** Label + control + inline error. Give the control aria-describedby={`${id}-error`} when error is set. */
export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={className ?? "space-y-2"}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {hint}
      </div>
      {children}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/** Props to spread on a control so it reflects a field error accessibly. */
export function invalidProps(id: string, error?: string) {
  return error
    ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` }
    : {};
}
