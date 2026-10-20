import { PageHeader } from "@/components/layout/page-header";
import { financeNav } from "@/config/nav";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Finance"
        description="Income, spending, and where it goes."
        tabs={financeNav}
      />
      {children}
    </>
  );
}
