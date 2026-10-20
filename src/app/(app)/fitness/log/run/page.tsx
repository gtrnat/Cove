import type { Metadata } from "next";
import { Footprints } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Log run" };

export default function LogRunPage() {
  return (
    <EmptyState
      icon={Footprints}
      title="Run logger"
      description="Distance, duration, and run type. Pace is calculated automatically."
    />
  );
}
