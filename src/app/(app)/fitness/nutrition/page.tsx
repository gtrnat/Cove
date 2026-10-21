import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { FoodLogBoard } from "@/features/nutrition/food-log-board";
import { mealForHour, round1 } from "@/features/nutrition/math";
import { dailyTotals, dayLog, recentFoods, weightHistory } from "@/features/nutrition/queries";
import { WeightForm } from "@/features/nutrition/weight-form";
import { getFitnessContext } from "@/features/strength/context";
import { addDays, formatDayHeading, todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Nutrition" };

export default function NutritionPage(props: PageProps<"/fitness/nutrition">) {
  return (
    <Suspense fallback={<NutritionSkeleton />}>
      <Nutrition searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Nutrition({ searchParams }: Pick<PageProps<"/fitness/nutrition">, "searchParams">) {
  const [{ user, settings, timezone }, params] = await Promise.all([getFitnessContext(), searchParams]);
  await connection();
  const today = todayKey(timezone);
  const raw = typeof params.date === "string" ? params.date : "";
  const day = /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const weekStartDay = addDays(day, -6);

  const [entries, totals, recent, weights] = await Promise.all([
    dayLog(user.id, day),
    dailyTotals(user.id, weekStartDay, day),
    recentFoods(user.id),
    weightHistory(user.id, 60),
  ]);

  const target = settings.dailyProteinTargetG;
  const protein = round1(entries.reduce((s, e) => s + e.proteinG, 0));
  const hasCalories = entries.some((e) => e.calories !== null);
  const calories = Math.round(entries.reduce((s, e) => s + (e.calories ?? 0), 0));
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStartDay, i);
    return { day: d, protein: totals[d]?.protein ?? 0 };
  });
  const weekMax = Math.max(target ?? 0, ...week.map((w) => w.protein), 1);
  const weightToday = weights.find((w) => w.day === day)?.weightKg ?? null;
  const latestWeight = weights.at(-1);

  const href = (d: string) => (d === today ? "/fitness/nutrition" : `/fitness/nutrition?date=${d}`);
  const navBtn = "grid size-8 place-items-center rounded-md border border-border-strong text-muted transition-colors hover:bg-surface-2 hover:text-foreground";

  return (
    <div className="space-y-6">
      <nav aria-label="Day" className="flex items-center gap-2">
        <Link href={href(addDays(day, -1))} className={navBtn} aria-label="Previous day">
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
        <p className="min-w-36 text-center text-sm font-medium" aria-live="polite">
          {day === today ? "Today" : day === addDays(today, -1) ? "Yesterday" : formatDayHeading(day)}
        </p>
        {day < today ? (
          <Link href={href(addDays(day, 1))} className={navBtn} aria-label="Next day">
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : (
          <span className={cn(navBtn, "pointer-events-none opacity-40")} aria-hidden="true">
            <ChevronRight className="size-4" />
          </span>
        )}
        {day !== today && (
          <Link href="/fitness/nutrition" className="ml-1 text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
            Today
          </Link>
        )}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="relative grid shrink-0 place-items-center">
            <ProgressRing
              value={protein}
              max={target ?? Math.max(protein, 1)}
              size={112}
              strokeWidth={8}
              label={target ? `${protein} of ${target} grams of protein` : `${protein} grams of protein`}
            />
            <span aria-hidden="true" className="tabular absolute text-lg font-medium">
              {target ? `${Math.min(999, Math.round((protein / target) * 100))}%` : `${protein}`}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-[13px] text-muted">Protein</p>
            <p className="tabular mt-1 text-3xl font-medium">
              {protein}
              <span className="text-lg text-muted"> {target ? `/ ${target} g` : "g"}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {target ? (
                protein >= target ? (
                  <span className="text-positive">Target reached</span>
                ) : (
                  `${round1(target - protein)} g to go`
                )
              ) : (
                <Link href="/settings" className="underline-offset-4 hover:text-foreground hover:underline">
                  Set a daily target
                </Link>
              )}
              {hasCalories ? ` · ${calories.toLocaleString("en-US")} kcal` : ""}
            </p>

            <div className="mt-5" aria-label="Protein over the last 7 days" role="img">
              <div className="relative flex h-14 items-end gap-1.5">
                {target && (
                  <div aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-faint/60" style={{ bottom: `${(target / weekMax) * 100}%` }} />
                )}
                {week.map((w) => (
                  <div key={w.day} className="flex h-full flex-1 items-end" title={`${formatDayHeading(w.day)} · ${round1(w.protein)} g`}>
                    <div
                      style={{ height: w.protein > 0 ? `max(${(w.protein / weekMax) * 100}%, 3px)` : "2px" }}
                      className={cn(
                        "w-full rounded-t-[3px]",
                        w.protein === 0 ? "bg-surface-2" : w.day === day ? "bg-accent" : target && w.protein >= target ? "bg-positive/60" : "bg-surface-3",
                      )}
                    />
                  </div>
                ))}
              </div>
              <div aria-hidden="true" className="mt-1 flex gap-1.5 text-[10px] text-faint">
                {week.map((w) => (
                  <span key={w.day} className="flex-1 text-center">
                    {formatDayHeading(w.day).slice(0, 2)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] text-muted">Body weight</p>
            {latestWeight && (
              <p className="tabular text-sm">
                {latestWeight.weightKg} kg <span className="text-xs text-muted">· {formatDayHeading(latestWeight.day)}</span>
              </p>
            )}
          </div>
          {weights.length > 1 && (
            <LineChart
              points={weights.map((w) => ({ label: formatDayHeading(w.day).replace(/^\w+, /, ""), value: w.weightKg }))}
              format={(v) => `${round1(v)} kg`}
              caption="Body weight over time"
              valueLabel="Weight"
            />
          )}
          <WeightForm key={day} day={day} current={weightToday} />
        </Card>
      </div>

      <FoodLogBoard key={day} day={day} entries={entries} recent={recent} suggestedMeal={day === today ? mealForHour(hour) : "lunch"} />
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-md bg-surface" />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="h-48 rounded-lg border bg-surface" />
        <div className="h-48 rounded-lg border bg-surface" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-lg border bg-surface" />
      ))}
    </div>
  );
}
