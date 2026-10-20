import { getSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export async function AccountCard() {
  const session = await getSession();
  if (!session) return <AccountCardSkeleton />;
  const { name, email } = session.user;

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2">
      <div
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-medium text-foreground"
      >
        {initials(name) || "·"}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate text-foreground">{name}</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>
      <SignOutButton variant="ghost" size="icon" iconOnly className="size-8" />
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 rounded-md px-2 py-2">
      <div className="size-8 rounded-full bg-surface-2" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 rounded bg-surface-2" />
        <div className="h-2.5 w-32 rounded bg-surface-2" />
      </div>
    </div>
  );
}
