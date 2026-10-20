"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

type SignOutButtonProps = Omit<ButtonProps, "onClick"> & { iconOnly?: boolean };

export function SignOutButton({ iconOnly, children, ...props }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label={iconOnly ? "Sign out" : undefined}
      title={iconOnly ? "Sign out" : undefined}
      {...props}
    >
      {pending ? <Spinner /> : <LogOut aria-hidden="true" />}
      {!iconOnly && (children ?? "Sign out")}
    </Button>
  );
}
