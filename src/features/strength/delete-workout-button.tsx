"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteWorkout } from "./actions";

export function DeleteWorkoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-muted">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    );
  }
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteWorkout(id);
          router.push("/fitness/history");
        })
      }
    >
      {pending ? <Spinner /> : <Trash2 aria-hidden="true" />}
      Confirm delete
    </Button>
  );
}
