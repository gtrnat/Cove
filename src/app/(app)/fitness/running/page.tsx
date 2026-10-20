import type { Metadata } from "next";
import { Footprints } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Running" };

export default function RunningPage() {
  return (
    <EmptyState
      icon={Footprints}
      title="No runs yet"
      description="Weekly distance, pace trends, and personal bests for 1K, 5K, and 10K."
    />
  );
}
