import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <EmptyState
      icon={PiggyBank}
      title="No budgets"
      description="Set a monthly limit overall or per category and watch how close you are."
    />
  );
}
