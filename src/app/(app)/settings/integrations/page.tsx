import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border bg-surface-2">
          <Mail aria-hidden="true" strokeWidth={1.5} className="size-5 text-muted" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-medium">Gmail · myBCA receipts</h2>
            <Badge>Not connected</Badge>
          </div>
          <p className="mt-1 max-w-md text-sm text-muted">
            A small Google Apps Script in your own Google account forwards myBCA
            receipts to Cove. Cove never gets access to your inbox.
          </p>
        </div>
      </div>
    </Card>
  );
}
