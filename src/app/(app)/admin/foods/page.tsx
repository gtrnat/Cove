import { eq, inArray, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { foods, users } from "@/db/schema";
import { AdminFoodEditor, type AdminFood } from "@/features/nutrition/admin-food-editor";
import { listFoods, newestCommunityFoods } from "@/features/nutrition/queries";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Food moderation" };

export default function AdminFoodsPage(props: PageProps<"/admin/foods">) {
  return (
    <>
      <PageHeader title="Food moderation" description="Correct, verify, or merge foods in the shared database." />
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-lg border bg-surface" />}>
        <Moderation searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Moderation({ searchParams }: Pick<PageProps<"/admin/foods">, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const view = params.view === "all" ? "all" : "community";

  let rows;
  if (q) {
    rows = await listFoods(q, 100);
    if (view === "community") rows = rows.filter((r) => r.status === "community");
  } else if (view === "community") {
    rows = await newestCommunityFoods(100);
  } else {
    rows = await listFoods("", 300);
  }

  const meta = rows.length
    ? await db
        .select({ id: foods.id, usageCount: foods.usageCount, creatorName: users.name, createdAt: foods.createdAt })
        .from(foods)
        .leftJoin(users, eq(users.id, foods.createdBy))
        .where(inArray(foods.id, rows.map((r) => r.id)))
    : [];
  const metaById = new Map(meta.map((m) => [m.id, m]));
  const items: (AdminFood & { createdAt: Date | null })[] = rows
    .map((r) => {
      const m = metaById.get(r.id);
      return { ...r, usageCount: m?.usageCount ?? 0, creatorName: m?.creatorName ?? null, createdAt: m?.createdAt ?? null };
    })
    .sort((a, b) => (view === "community" ? +(b.createdAt ?? 0) - +(a.createdAt ?? 0) : 0));

  const [{ pending }] = await db
    .select({ pending: sql<number>`count(*)::int` })
    .from(foods)
    .where(eq(foods.status, "community"));

  const tab = (v: string, label: string) => (
    <Link
      href={`/admin/foods${v === "all" ? "?view=all" : ""}${q ? `${v === "all" ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`}
      aria-current={view === v ? "page" : undefined}
      className={cn("rounded-md px-3 py-1.5 text-sm", view === v ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground")}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter" className="flex gap-1">
          {tab("community", `Community (${pending})`)}
          {tab("all", "All foods")}
        </nav>
        <form role="search" className="relative w-full sm:w-72">
          {view === "all" && <input type="hidden" name="view" value="all" />}
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input type="search" name="q" defaultValue={q} aria-label="Search foods" placeholder="Search foods" className="pl-9" />
        </form>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted">
          {view === "community" ? "No community foods waiting. Everything is verified." : "No foods match."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-surface">
          {items.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm">
                  <span className="truncate">
                    {f.name}
                    {f.brand && <span className="text-muted"> · {f.brand}</span>}
                  </span>
                  {f.status === "community" ? <Badge>Community</Badge> : <Badge variant="accent">Verified</Badge>}
                </p>
                <p className="tabular text-xs text-muted">
                  {f.proteinPer100g} g protein · {f.caloriesPer100g ?? "—"} kcal / 100 g · used {f.usageCount}×
                  {f.creatorName ? ` · by ${f.creatorName}` : ""}
                </p>
              </div>
              <AdminFoodEditor food={f} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
