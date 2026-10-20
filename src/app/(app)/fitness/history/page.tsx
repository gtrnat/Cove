import type { Metadata } from "next";
import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <EmptyState
      icon={History}
      title="No sessions yet"
      description="Every workout and run you log, newest first."
    />
  );
}
