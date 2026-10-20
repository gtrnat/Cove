"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, invalidProps } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toLocalDateTime } from "@/lib/dates";
import { formatAmountInput } from "@/lib/format";
import { deleteTransaction, saveTransaction } from "./actions";
import type { FormState } from "./schemas";

export type CategoryChoice = { id: string; name: string; type: "expense" | "income" };

export type EditableTransaction = {
  id: string;
  type: "expense" | "income";
  amount: number;
  merchant: string;
  description: string | null;
  categoryId: string | null;
  occurredAt: Date;
  source: "manual" | "email";
};

type TransactionFormProps = {
  categories: CategoryChoice[];
  timezone: string;
  transaction?: EditableTransaction;
  onDone: () => void;
};

const idle: FormState = { status: "idle" };

export function TransactionForm({ categories, timezone, transaction, onDone }: TransactionFormProps) {
  const [state, action, pending] = useActionState(saveTransaction, idle);
  const [type, setType] = useState<"expense" | "income">(transaction?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [amount, setAmount] = useState(transaction ? formatAmountInput(transaction.amount) : "");
  const [occurredAt] = useState(() => toLocalDateTime(transaction?.occurredAt ?? new Date(), timezone));
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  const options = categories.filter((c) => c.type === type);

  function changeType(next: "expense" | "income") {
    setType(next);
    // Categories are typed; drop a selection that no longer applies.
    if (!categories.some((c) => c.id === categoryId && c.type === next)) setCategoryId("");
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      <Segmented
        name="type"
        legend="Transaction type"
        value={type}
        onChange={changeType}
        options={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />

      <Field id="tx-amount" label="Amount" hint={<span className="text-xs text-muted">Rp</span>} error={errors.amount}>
        <Input
          id="tx-amount"
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="25.000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => {
            const digits = amount.replace(/\D/g, "");
            if (digits) setAmount(formatAmountInput(Number(digits)));
          }}
          className="tabular h-12 text-lg"
          autoFocus={!transaction}
          {...invalidProps("tx-amount", errors.amount)}
        />
      </Field>

      <Field
        id="tx-merchant"
        label={type === "expense" ? "Paid to" : "Received from"}
        error={errors.merchant}
      >
        <Input
          id="tx-merchant"
          name="merchant"
          autoComplete="off"
          placeholder={type === "expense" ? "e.g. Elox Jus Sentul" : "e.g. Salary"}
          defaultValue={transaction?.merchant}
          maxLength={120}
          {...invalidProps("tx-merchant", errors.merchant)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="tx-category" label="Category" error={errors.categoryId}>
          <Select
            id="tx-category"
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            {...invalidProps("tx-category", errors.categoryId)}
          >
            <option value="">Uncategorized</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="tx-date" label="Date & time" error={errors.occurredAt}>
          <Input
            id="tx-date"
            name="occurredAt"
            type="datetime-local"
            defaultValue={occurredAt}
            className="[color-scheme:dark]"
            {...invalidProps("tx-date", errors.occurredAt)}
          />
        </Field>
      </div>

      <Field id="tx-note" label="Note" hint={<span className="text-xs text-muted">Optional</span>} error={errors.description}>
        <Textarea
          id="tx-note"
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={transaction?.description ?? ""}
          {...invalidProps("tx-note", errors.description)}
        />
      </Field>

      {transaction?.source === "email" && (
        <p className="text-xs text-muted">Imported from a myBCA receipt.</p>
      )}

      <FormMessage>{state.status === "error" && !pending ? state.message : undefined}</FormMessage>

      <div className="flex items-center justify-between gap-3 pt-1">
        {transaction ? <DeleteButton id={transaction.id} onDeleted={onDone} /> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {transaction ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Two-step delete so a stray click can't remove a transaction. */
function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-muted">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteTransaction(id);
          onDeleted();
        })
      }
    >
      {pending ? <Spinner /> : <Trash2 aria-hidden="true" />}
      Confirm delete
    </Button>
  );
}
