import Link from "next/link";
import { Activity } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getFitnessContext } from "./context";
import { getTrainingSummary } from "./overview";
import { listSessions } from "./queries";
import { SessionList } from "./session-list";

export async function SessionsThisWeekStat() {
  const { thisWeek, streak } = await getTrainingSummary();
  return (
    <StatCard
      label="Sessions this week"
      value={thisWeek.sessions}
      hint={streak > 0 ? `${streak}-week streak` : "Lifts and runs"}
      icon={Activity}
    />
  );
}

export async function RecentActivity() {
  const { user, timezone } = await getFitnessContext();
  const { rows } = await listSessions(user.id, { limit: 3 });
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No sessions logged"
        description="Your lifts and runs will show up here."
        action={
          <Link href="/fitness/log/strength" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Log a workout
          </Link>
        }
        className="border-0 py-10"
      />
    );
  }
  return <SessionList sessions={rows} timezone={timezone} />;
}
