import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <EmptyState
      icon={Tags}
      title="No rules"
      description="Rules sort incoming transactions automatically. For example, merchants containing “GRAB” go to Transport."
    />
  );
}
