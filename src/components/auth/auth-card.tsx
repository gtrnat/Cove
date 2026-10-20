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
