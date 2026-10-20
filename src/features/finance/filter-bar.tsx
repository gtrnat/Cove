"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { CategoryChoice } from "./transaction-form";

/** Filters live in the URL so they survive reloads and can be shared or linked to. */
export function FilterBar({ categories }: { categories: CategoryChoice[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page"); // any filter change starts from the first page
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => () => clearTimeout(debounce.current), []);

  const type = params.get("type") ?? "";
  const category = params.get("category") ?? "";
  const source = params.get("source") ?? "";
  const visibleCategories = categories.filter((c) => !type || c.type === type);
  const hasFilters = Boolean(type || category || source || params.get("q"));

  return (
    <div role="search" aria-label="Filter transactions" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          aria-label="Search merchant or note"
          placeholder="Search merchant or note"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            clearTimeout(debounce.current);
            debounce.current = setTimeout(() => update({ q: value.trim() || null }), 300);
          }}
          className="pl-9"
        />
      </div>

      <Select
        aria-label="Type"
        value={type}
        onChange={(e) => {
          const next = e.target.value || null;
          // Drop a category filter that doesn't match the new type.
          const keepCategory = !next || categories.some((c) => c.id === category && c.type === next) || category === "none";
          update({ type: next, category: keepCategory ? category || null : null });
        }}
        className="sm:w-36"
      >
        <option value="">All types</option>
        <option value="expense">Expenses</option>
        <option value="income">Income</option>
      </Select>

      <Select
        aria-label="Category"
        value={category}
        onChange={(e) => update({ category: e.target.value || null })}
        className="sm:w-48"
      >
        <option value="">All categories</option>
        <option value="none">Uncategorized</option>
        {visibleCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select aria-label="Source" value={source} onChange={(e) => update({ source: e.target.value || null })} className="sm:w-36">
        <option value="">All sources</option>
        <option value="manual">Manual</option>
        <option value="email">Email</option>
      </Select>

      <div className="flex h-10 items-center gap-3">
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              update({ q: null, type: null, category: null, source: null });
            }}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear
          </button>
        )}
        {pending && <Spinner className="text-muted" />}
      </div>
    </div>
  );
}
