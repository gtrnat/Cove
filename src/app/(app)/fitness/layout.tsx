import Link from "next/link";
import { Dumbbell, Footprints } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { fitnessNav } from "@/config/nav";

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Fitness"
        description="Training, running, and nutrition."
        tabs={fitnessNav}
        actions={
          <>
            <Link href="/fitness/log/run" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Footprints aria-hidden="true" />
              Log run
            </Link>
            <Link href="/fitness/log/strength" className={buttonVariants({ size: "sm" })}>
              <Dumbbell aria-hidden="true" />
              Log workout
            </Link>
          </>
        }
      />
      {children}
    </>
  );
}
