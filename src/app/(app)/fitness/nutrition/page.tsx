import type { Metadata } from "next";
import { Beef } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";

export const metadata: Metadata = { title: "Nutrition" };

export default function NutritionPage() {
  return (
    <div className="space-y-6">
      <Card className="flex items-center gap-6 p-6">
        <ProgressRing value={0} max={1} size={88} strokeWidth={6} label="0 grams of protein logged today" />
        <div>
          <p className="text-[13px] text-muted">Protein today</p>
          <p className="tabular mt-1 text-3xl font-medium">
            0<span className="text-lg text-muted"> g</span>
          </p>
          <p className="mt-1 text-xs text-muted">Set a daily target in Settings</p>
        </div>
      </Card>

      <EmptyState
        icon={Beef}
        title="Nothing logged today"
        description="Pick a food and an amount, like 3 eggs or 150 g of chicken breast. Protein is calculated for you."
      />
    </div>
  );
}
