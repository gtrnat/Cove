import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryManager } from "@/features/finance/category-manager";
import { getCategoriesWithCounts } from "@/features/finance/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <p className="mb-6 max-w-xl text-sm text-muted">
        Categories group your spending and income. Archiving hides a category from pickers but keeps it on
        past transactions.
      </p>
      <Suspense fallback={<CategoriesSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const user = await requireUser();
  const rows = await getCategoriesWithCounts(user.id);
  return (
    <CategoryManager
      categories={rows.map((r) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        icon: r.icon,
        color: r.color,
        archived: r.archivedAt !== null,
        count: r.count,
      }))}
    />
  );
}

function CategoriesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid animate-pulse gap-8 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-40 rounded bg-surface" />
          <div className="h-80 rounded-lg border bg-surface" />
        </div>
      ))}
    </div>
  );
}
