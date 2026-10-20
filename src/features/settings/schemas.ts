import { z } from "zod";
import { timezones } from "./defaults";

const timezoneValues = timezones.map((t) => t.value) as [string, ...string[]];

/** "" → null, "2.500.000" / "2,500,000" → 2500000 */
const optionalWholeNumber = (max: number, label: string) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[.,\s]/g, ""))
    .pipe(
      z.union([
        z.literal("").transform(() => null),
        z
          .string()
          .regex(/^\d+$/, `${label} must be a whole number.`)
          .transform(Number)
          .pipe(z.number().int().min(0).max(max, `${label} is too large.`)),
      ]),
    );

export const preferencesSchema = z.object({
  dailyProteinTargetG: optionalWholeNumber(1000, "Protein target"),
  monthlyBudget: optionalWholeNumber(1_000_000_000_000, "Monthly budget"),
  timezone: z.enum(timezoneValues, "Pick a timezone from the list."),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};
