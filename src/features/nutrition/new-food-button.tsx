"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CreateFoodForm } from "./create-food-form";

export function NewFoodButton() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string>();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Add food
      </Button>
      {created && (
        <p role="status" className="text-sm text-positive">
          Added {created}.
        </p>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Add a food" className="max-w-lg">
        <CreateFoodForm
          onCancel={() => setOpen(false)}
          onCreated={(food) => {
            setCreated(food.name);
            setOpen(false);
          }}
        />
      </Dialog>
    </>
  );
}
