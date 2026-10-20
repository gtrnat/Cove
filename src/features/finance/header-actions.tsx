import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFinanceContext } from "./context";
import { AddTransactionButton, TransactionEditor } from "./transaction-editor";

/** "Add transaction" for the Finance header. Streams in once categories are loaded. */
export async function FinanceHeaderActions() {
  const { categoryChoices, timezone } = await getFinanceContext();
  return (
    <TransactionEditor categories={categoryChoices} timezone={timezone}>
      <AddTransactionButton size="sm" />
    </TransactionEditor>
  );
}

export function FinanceHeaderActionsFallback() {
  return (
    <Button size="sm" disabled>
      <Plus aria-hidden="true" />
      Add transaction
    </Button>
  );
}
