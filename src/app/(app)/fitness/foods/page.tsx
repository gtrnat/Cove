import type { Metadata } from "next";
import { Suspense } from "react";
import { Search, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { unitText } from "@/features/nutrition/math";
import { listFoods } from "@/features/nutrition/queries";
import { NewFoodButton } from "@/features/nutrition/new-food-button";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Foods" };

export default function FoodsPage(props: PageProps<"/fitness/foods">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          One food database for everyone on Cove. Verified foods are curated; community foods are added by people
          like you. Nutrition is per 100 g.
        </p>
        <NewFoodButton />
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
        <FoodList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function FoodList({ searchParams }: Pick<PageProps<"/fitness/foods">, "searchParams">) {
  await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const rows = await listFoods(q, 60);

  return (
    <div className="space-y-4">
      <form role="search" className="relative sm:max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input type="search" name="q" defaultValue={q} aria-label="Search foods" placeholder="Search foods" className="pl-9" />
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={SearchX} title="No foods match" description="Try another word, or add it as a new food." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2.5 font-normal">Food</th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">Protein</th>
                <th scope="col" className="hidden px-3 py-2.5 text-right font-normal sm:table-cell">kcal</th>
                <th scope="col" className="hidden px-3 py-2.5 text-right font-normal md:table-cell">Carbs</th>
                <th scope="col" className="hidden px-3 py-2.5 text-right font-normal md:table-cell">Fat</th>
                <th scope="col" className="hidden px-4 py-2.5 font-normal lg:table-cell">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="min-w-0">
                        {f.name}
                        {f.brand && <span className="text-muted"> · {f.brand}</span>}
                      </span>
                      {f.status === "community" ? <Badge>Community</Badge> : <Badge variant="accent">Verified</Badge>}
                    </span>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{f.proteinPer100g} g</td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted sm:table-cell">{f.caloriesPer100g ?? "—"}</td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted md:table-cell">{f.carbsPer100g ?? "—"}</td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted md:table-cell">{f.fatPer100g ?? "—"}</td>
                  <td className="hidden px-4 py-2.5 text-xs text-muted lg:table-cell">
                    {f.units.map((u) => unitText(u.label, u.gramsPerUnit)).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
