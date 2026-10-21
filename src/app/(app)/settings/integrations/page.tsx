import { and, count, desc, eq, isNull, max } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { apiKeys, transactions } from "@/db/schema";
import { env } from "@/env";
import { ApiKeyManager } from "@/features/ingest/api-key-manager";
import { getUserSettings } from "@/features/settings/queries";
import { maskedKey } from "@/lib/api-keys";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border bg-surface-2">
          <Mail aria-hidden="true" strokeWidth={1.5} className="size-5 text-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-medium">Gmail · myBCA receipts</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            A small Google Apps Script in your own Google account forwards myBCA receipts (QRIS, transfers,
            virtual accounts) to Cove every 5 minutes. Cove never gets access to your inbox, and each email
            is recorded only once.
          </p>
          <div className="mt-6">
            <Suspense fallback={<div aria-hidden="true" className="h-24 animate-pulse rounded-lg bg-surface-2/50" />}>
              <GmailIntegration />
            </Suspense>
          </div>
        </div>
      </div>
    </Card>
  );
}

async function GmailIntegration() {
  const user = await requireUser();
  const [{ timezone }, keys, [stats]] = await Promise.all([
    getUserSettings(user.id),
    db
      .select({ id: apiKeys.id, keyId: apiKeys.keyId, createdAt: apiKeys.createdAt, lastUsedAt: apiKeys.lastUsedAt })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, user.id), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt)),
    db
      .select({ n: count(), last: max(transactions.createdAt) })
      .from(transactions)
      .where(and(eq(transactions.userId, user.id), eq(transactions.source, "email"))),
  ]);

  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const connected = keys.some((k) => k.lastUsedAt);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {connected ? <Badge variant="positive">Connected</Badge> : <Badge>Not connected</Badge>}
        <span className="text-muted">
          <span className="tabular text-foreground">{stats?.n ?? 0}</span> imported
          {stats?.last ? ` · latest ${fmt.format(stats.last)}` : ""}
        </span>
      </div>
      <ApiKeyManager
        appUrl={env.BETTER_AUTH_URL}
        keys={keys.map((k) => ({
          id: k.id,
          masked: maskedKey(k.keyId),
          createdAt: fmt.format(k.createdAt),
          lastUsedAt: k.lastUsedAt ? fmt.format(k.lastUsedAt) : null,
        }))}
      />
    </div>
  );
}
