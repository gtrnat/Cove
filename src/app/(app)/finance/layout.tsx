import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { financeNav } from "@/config/nav";
import { FinanceHeaderActions, FinanceHeaderActionsFallback } from "@/features/finance/header-actions";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Finance"
        description="Income, spending, and where it goes."
        tabs={financeNav}
        actions={
          <Suspense fallback={<FinanceHeaderActionsFallback />}>
            <FinanceHeaderActions />
          </Suspense>
        }
      />
      {children}
    </>
  );
}
