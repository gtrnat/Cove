"use client";

import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { setCategoryArchived } from "./actions";
import { CategoryIcon } from "./category-badge";
import { CategoryForm, type EditableCategory } from "./category-form";

export type ManagedCategory = EditableCategory & { archived: boolean; count: number };

type DialogState = { mode: "closed" } | { mode: "new"; type: "expense" | "income" } | { mode: "edit"; category: EditableCategory };

export function CategoryManager({ categories }: { categories: ManagedCategory[] }) {
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const close = useCallback(() => setDialog({ mode: "closed" }), []);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        {(["expense", "income"] as const).map((type) => (
          <CategoryGroup
            key={type}
            type={type}
            categories={categories.filter((c) => c.type === type)}
            onAdd={() => setDialog({ mode: "new", type })}
            onEdit={(category) => setDialog({ mode: "edit", category })}
          />
        ))}
      </div>

      <Dialog
        open={dialog.mode !== "closed"}
        onClose={close}
        title={dialog.mode === "edit" ? "Edit category" : "New category"}
      >
        <CategoryForm
          key={dialog.mode === "edit" ? dialog.category.id : dialog.mode === "new" ? `new-${dialog.type}` : "closed"}
          category={dialog.mode === "edit" ? dialog.category : undefined}
          defaultType={dialog.mode === "new" ? dialog.type : "expense"}
          onDone={close}
        />
      </Dialog>
    </>
  );
}

function CategoryGroup({
  type,
  categories,
  onAdd,
  onEdit,
}: {
  type: "expense" | "income";
  categories: ManagedCategory[];
  onAdd: () => void;
  onEdit: (c: EditableCategory) => void;
}) {
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);
  const title = type === "expense" ? "Expense categories" : "Income categories";

  return (
    <section aria-labelledby={`cat-${type}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`cat-${type}`} className="text-[15px] font-medium">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>
      <ul className="divide-y rounded-lg border bg-surface">
        {active.map((c) => (
          <CategoryRow key={c.id} category={c} onEdit={onEdit} />
        ))}
        {active.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No categories yet.</li>}
      </ul>

      {archived.length > 0 && (
        <details className="group mt-4">
          <summary className="cursor-pointer select-none text-xs text-muted hover:text-foreground">
            Archived ({archived.length})
          </summary>
          <ul className="mt-2 divide-y rounded-lg border bg-surface/50">
            {archived.map((c) => (
              <CategoryRow key={c.id} category={c} onEdit={onEdit} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function CategoryRow({ category, onEdit }: { category: ManagedCategory; onEdit: (c: EditableCategory) => void }) {
  const [pending, startTransition] = useTransition();
  const toggle = () => startTransition(async () => void (await setCategoryArchived(category.id, !category.archived)));

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <CategoryIcon icon={category.icon} color={category.color} size="sm" />
      <div className="min-w-0 flex-1">
        <p className={category.archived ? "truncate text-sm text-muted" : "truncate text-sm"}>{category.name}</p>
        <p className="text-xs text-muted">
          {category.count} {category.count === 1 ? "transaction" : "transactions"}
        </p>
      </div>
      {category.archived && <Badge>Archived</Badge>}
      <div className="flex">
        {!category.archived && (
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(category)} aria-label={`Edit ${category.name}`}>
            <Pencil aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={toggle}
          disabled={pending}
          aria-label={category.archived ? `Restore ${category.name}` : `Archive ${category.name}`}
          title={category.archived ? "Restore" : "Archive"}
        >
          {category.archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
        </Button>
      </div>
    </li>
  );
}
