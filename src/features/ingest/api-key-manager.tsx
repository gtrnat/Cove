"use client";

import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { createApiKey, revokeApiKey } from "./actions";
import { buildAppsScript } from "./apps-script";

export type KeySummary = {
  id: string;
  masked: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export function ApiKeyManager({ keys, appUrl }: { keys: KeySummary[]; appUrl: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(undefined);
    startTransition(async () => {
      const res = await createApiKey();
      if (res.ok) setToken(res.token);
      else setError(res.message);
    });
  }

  return (
    <div className="space-y-4">
      {keys.length > 0 && (
        <ul className="divide-y rounded-lg border bg-surface">
          {keys.map((k) => (
            <KeyRow key={k.id} k={k} />
          ))}
        </ul>
      )}

      <FormMessage>{error}</FormMessage>

      <Button onClick={generate} disabled={pending} variant={keys.length ? "secondary" : "primary"}>
        {pending ? <Spinner /> : <Plus aria-hidden="true" />}
        {keys.length ? "Generate another key" : "Generate key & script"}
      </Button>

      <Dialog
        open={token !== null}
        onClose={() => setToken(null)}
        title="Your Apps Script"
        description="This is the only time the key is shown. Copy the script now."
        className="max-w-2xl"
      >
        {token && <ScriptSetup script={buildAppsScript({ appUrl, token })} onDone={() => setToken(null)} />}
      </Dialog>
    </div>
  );
}

function ScriptSetup({ script, onDone }: { script: string; onDone: () => void }) {
  return (
    <div className="space-y-5">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted marker:text-faint">
        <li>
          Open{" "}
          <a
            href="https://script.google.com/home/projects/create"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            script.google.com
          </a>{" "}
          with the Google account that receives your myBCA emails.
        </li>
        <li>Delete the sample code, paste the script below, and save.</li>
        <li>
          Choose <span className="font-mono text-foreground">setup</span> in the toolbar, press Run, and approve the
          permissions.
        </li>
        <li>It imports the last 30 days, then syncs every 5 minutes.</li>
      </ol>

      <div className="relative">
        <textarea
          readOnly
          value={script}
          aria-label="Apps Script code"
          rows={10}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full resize-none rounded-md border border-border-strong bg-background p-3 font-mono text-xs leading-relaxed text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Done
        </Button>
        <CopyButton value={script} label="Copy script" />
      </div>
    </div>
  );
}

function KeyRow({ k }: { k: KeySummary }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <KeyRound aria-hidden="true" strokeWidth={1.75} className="size-4 text-faint" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-foreground">{k.masked}</p>
        <p className="text-xs text-muted">
          Created {k.createdAt} · {k.lastUsedAt ? `last used ${k.lastUsedAt}` : "never used"}
        </p>
      </div>
      {k.lastUsedAt ? <Badge variant="positive">Active</Badge> : <Badge>Waiting</Badge>}
      {confirming ? (
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => revokeApiKey(k.id))}
        >
          {pending ? <Spinner /> : <Trash2 aria-hidden="true" />}
          Confirm revoke
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-muted">
          Revoke
        </Button>
      )}
    </li>
  );
}
