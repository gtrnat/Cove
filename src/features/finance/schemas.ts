import { z } from "zod";
import { categoryColors, categoryIconKeys } from "./icons";

/** "12.000" / "12,000" / "12000" → 12000 */
const amount = z
  .string()
  .trim()
  .transform((v) => v.replace(/[.,\s]/g, "").replace(/^rp/i, ""))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, "Enter an amount in rupiah, e.g. 25.000.")
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1, "Amount must be more than zero.")
          .max(100_000_000_000, "Amount is too large."),
      ),
  );

/** datetime-local value: "2026-10-18T11:03" */
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time.");

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.uuid("Pick a category from the list.").nullable());

export const transactionSchema = z.object({
  type: z.enum(["expense", "income"], "Choose expense or income."),
  amount,
  merchant: z.string().trim().min(1, "Enter where the money went or came from.").max(120, "Too long."),
  categoryId: optionalUuid,
  occurredAt: localDateTime,
  description: z
    .string()
    .trim()
    .max(500, "Note is too long.")
    .transform((v) => (v === "" ? null : v)),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  type: z.enum(["expense", "income"], "Choose expense or income."),
  name: z.string().trim().min(1, "Enter a name.").max(40, "Keep it under 40 characters."),
  icon: z.enum(categoryIconKeys as [string, ...string[]], "Pick an icon."),
  color: z.enum(categoryColors, "Pick a color."),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const transactionFiltersSchema = z.object({
  type: z.enum(["expense", "income"]).optional().catch(undefined),
  category: z.union([z.uuid(), z.literal("none")]).optional().catch(undefined),
  source: z.enum(["manual", "email"]).optional().catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};
