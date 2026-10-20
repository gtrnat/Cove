import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Log workout" };

export default function LogStrengthPage() {
  return (
    <EmptyState
      icon={Dumbbell}
      title="Workout logger"
      description="Add exercises, then log each set with weight, reps, and optional RPE."
    />
  );
}
