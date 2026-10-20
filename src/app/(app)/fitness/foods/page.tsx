import type { Metadata } from "next";
import { Apple } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Foods" };

export default function FoodsPage() {
  return (
    <EmptyState
      icon={Apple}
      title="Food library"
      description="Search common foods or add your own. New foods are shared with everyone on Cove."
    />
  );
}
