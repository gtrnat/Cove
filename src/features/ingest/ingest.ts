import "server-only";
import { z } from "zod";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { parseBcaEmail } from "./bca-parser";
import { getActiveRules, matchRule } from "./rules";

export const ingestRequestSchema = z.object({
  emails: z
    .array(
      z.object({
        messageId: z.string().min(1).max(200),
        receivedAt: z.string().max(40).optional(),
        subject: z.string().max(500).optional(),
        body: z.string().max(20_000),
      }),
    )
    .max(50, "Send at most 50 emails per request."),
});

export type IngestEmail = z.infer<typeof ingestRequestSchema>["emails"][number];

export type IngestResult = {
  messageId: string;
  status: "imported" | "duplicate" | "skipped" | "unparsed";
  reason?: string;
  merchant?: string;
  amount?: number;
  reference?: string;
};

/**
 * Parse and store BCA receipt emails for one user. Idempotent: the unique
 * (user_id, external_id) constraint turns re-sent emails into "duplicate".
 */
export async function ingestEmails(userId: string, emails: IngestEmail[]): Promise<IngestResult[]> {
  if (emails.length === 0) return [];
  const rules = await getActiveRules(userId);
  const results: IngestResult[] = [];

  for (const email of emails) {
    const parsed = parseBcaEmail(email.body);
    if (!parsed.ok) {
      results.push({
        messageId: email.messageId,
        status: parsed.reason === "not_successful" ? "skipped" : "unparsed",
        reason: parsed.detail,
      });
      continue;
    }

    const tx = parsed.value;
    const rawMerchant = typeof tx.metadata.rawMerchant === "string" ? tx.metadata.rawMerchant : undefined;
    const company = typeof tx.metadata.company === "string" ? tx.metadata.company : undefined;
    const inserted = await db
      .insert(transactions)
      .values({
        userId,
        type: "expense",
        amount: tx.amount,
        merchant: tx.merchant,
        categoryId: matchRule(rules, tx.merchant, rawMerchant, company),
        source: "email",
        provider: "bca",
        externalId: tx.externalId ?? `gmail:${email.messageId}`,
        metadata: { ...tx.metadata, kind: tx.kind, gmailMessageId: email.messageId },
        occurredAt: tx.occurredAt,
      })
      .onConflictDoNothing({ target: [transactions.userId, transactions.externalId] })
      .returning({ id: transactions.id });

    results.push({
      messageId: email.messageId,
      status: inserted.length > 0 ? "imported" : "duplicate",
      merchant: tx.merchant,
      amount: tx.amount,
      reference: tx.reference ?? undefined,
    });
  }
  return results;
}
