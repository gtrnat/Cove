"use client";

import { Plus } from "lucide-react";
import { createContext, use, useCallback, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  TransactionForm,
  type CategoryChoice,
  type EditableTransaction,
} from "./transaction-form";

type EditorState = { mode: "closed" } | { mode: "new" } | { mode: "edit"; transaction: EditableTransaction };

const EditorContext = createContext<{
  openNew: () => void;
  openEdit: (t: EditableTransaction) => void;
} | null>(null);

type EditorProps = {
  categories: CategoryChoice[];
  timezone: string;
  children: React.ReactNode;
};

/** Owns one dialog for adding/editing transactions; descendants open it via context. */
export function TransactionEditor({ categories, timezone, children }: EditorProps) {
  const [state, setState] = useState<EditorState>({ mode: "closed" });
  const close = useCallback(() => setState({ mode: "closed" }), []);
  const openNew = useCallback(() => setState({ mode: "new" }), []);
  const openEdit = useCallback((transaction: EditableTransaction) => setState({ mode: "edit", transaction }), []);

  return (
    <EditorContext value={{ openNew, openEdit }}>
      {children}
      <Dialog
        open={state.mode !== "closed"}
        onClose={close}
        title={state.mode === "edit" ? "Edit transaction" : "New transaction"}
      >
        <TransactionForm
          // Remount per transaction so form state never leaks between edits.
          key={state.mode === "edit" ? state.transaction.id : "new"}
          categories={categories}
          timezone={timezone}
          transaction={state.mode === "edit" ? state.transaction : undefined}
          onDone={close}
        />
      </Dialog>
    </EditorContext>
  );
}

function useEditor() {
  const ctx = use(EditorContext);
  if (!ctx) throw new Error("Must be used inside <TransactionEditor>");
  return ctx;
}

export function AddTransactionButton(props: Omit<ButtonProps, "onClick">) {
  const { openNew } = useEditor();
  return (
    <Button type="button" onClick={openNew} {...props}>
      <Plus aria-hidden="true" />
      Add transaction
    </Button>
  );
}

/** Wraps a server-rendered row so clicking it opens the editor. */
export function EditTransactionTrigger({
  transaction,
  label,
  children,
  className,
}: {
  transaction: EditableTransaction;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { openEdit } = useEditor();
  return (
    <button type="button" onClick={() => openEdit(transaction)} aria-label={label} className={className}>
      {children}
    </button>
  );
}
