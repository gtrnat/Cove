import { Label } from "@/components/ui/label";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      {children}
      <p className="mt-8 text-center text-sm text-muted">{footer}</p>
    </>
  );
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {hint}
      </div>
      {children}
    </div>
  );
}

/** Placeholder with the same footprint as an auth form, shown while it hydrates. */
export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden="true" className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-16 rounded bg-surface-2" />
          <div className="h-10 rounded-md border border-border-strong bg-surface" />
        </div>
      ))}
      <div className="h-11 rounded-md bg-accent/40" />
    </div>
  );
}
