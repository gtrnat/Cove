import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <EmptyState
      icon={Receipt}
      title="No transactions"
      description="Every expense and income entry, filterable by date, category, and source."
    />
  );
}
