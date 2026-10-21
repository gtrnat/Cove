import Link from "next/link";
import { connection } from "next/server";
import { Beef, Scale } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { getFitnessContext } from "@/features/strength/context";
import { formatDayHeading, todayKey } from "@/lib/dates";
import { round1 } from "./math";
import { dailyTotals, weightHistory } from "./queries";

export async function ProteinTodayStat() {
  const { user, settings, timezone } = await getFitnessContext();
  await connection();
  const today = todayKey(timezone);
  const totals = await dailyTotals(user.id, today, today);
  const protein = round1(totals[today]?.protein ?? 0);
  const target = settings.dailyProteinTargetG;
  const pct = target ? Math.min(protein / target, 1) : 0;

  return (
    <StatCard
      label="Protein today"
      value={`${protein} g`}
      icon={Beef}
      hint={
        target ? (
          `of ${target} g target`
        ) : (
          <Link href="/settings" className="underline-offset-4 hover:text-foreground hover:underline">
            Set a daily target
          </Link>
        )
      }
    >
      {target ? (
        <div
          role="progressbar"
          aria-label="Protein target progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          className="h-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div className={pct >= 1 ? "h-full rounded-full bg-positive" : "h-full rounded-full bg-accent"} style={{ width: `${pct * 100}%` }} />
        </div>
      ) : null}
    </StatCard>
  );
}

export async function BodyWeightStat() {
  const { user } = await getFitnessContext();
  const history = await weightHistory(user.id, 30);
  const latest = history.at(-1);
  const first = history[0];
  const change = latest && first && history.length > 1 ? round1(latest.weightKg - first.weightKg) : null;

  return (
    <StatCard
      label="Body weight"
      value={latest ? `${latest.weightKg} kg` : "—"}
      icon={Scale}
      hint={
        latest ? (
          `${formatDayHeading(latest.day)}${change !== null ? ` · ${change > 0 ? "+" : ""}${change} kg since ${formatDayHeading(first.day)}` : ""}`
        ) : (
          <Link href="/fitness/nutrition" className="underline-offset-4 hover:text-foreground hover:underline">
            Log your weight
          </Link>
        )
      }
    />
  );
}
