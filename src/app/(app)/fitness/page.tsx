import type { Metadata } from "next";
import { Activity, Beef, Dumbbell, Footprints, Scale } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = { title: "Fitness" };

export default function FitnessOverviewPage() {
  return (
    <div className="space-y-6">
      <section aria-label="This week" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Streak" value="0 days" hint="Consecutive training days" icon={Activity} />
        <StatCard label="Volume this week" value="0 kg" hint="Weight × reps" icon={Dumbbell} />
        <StatCard label="Distance this week" value="0 km" hint="All runs" icon={Footprints} />
        <StatCard label="Body weight" value="—" hint="Log your weight" icon={Scale} />
      </section>

      <EmptyState
        icon={Beef}
        title="Start your first session"
        description="Log a workout or a run and your progress charts will appear here."
      />
    </div>
  );
}
