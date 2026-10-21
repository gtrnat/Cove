import "server-only";
import { z } from "zod";

/*
 * Server environment, validated once at startup so a missing or malformed
 * variable fails loudly instead of surfacing as a confusing runtime error.
 */
const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  /** Production URL (no trailing slash). Preview deployments derive their own, see APP_URL below. */
  BETTER_AUTH_URL: z.url(),
  /** Comma-separated emails that get the admin role when they register. */
  ADMIN_EMAILS: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  /** "false" closes sign-up for everyone except ADMIN_EMAILS. Defaults to open. */
  ALLOW_REGISTRATION: z
    .enum(["true", "false"], "ALLOW_REGISTRATION must be true or false")
    .optional()
    .transform((v) => v !== "false"),
  // Set automatically by Vercel.
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_BRANCH_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}\nSee .env.example.`);
}

const raw = parsed.data;
const isPreview = raw.VERCEL_ENV === "preview";
const previewHosts = [raw.VERCEL_BRANCH_URL, raw.VERCEL_URL].filter((h): h is string => Boolean(h));

export const env = {
  ...raw,
  /**
   * The URL this deployment is served from. On preview deployments the
   * production BETTER_AUTH_URL would fail Better Auth's origin check, so the
   * preview's own URL is used instead.
   */
  APP_URL: isPreview && previewHosts[0] ? `https://${previewHosts[0]}` : raw.BETTER_AUTH_URL.replace(/\/+$/, ""),
  /** Extra origins allowed to call /api/auth (both preview URLs: per-branch and per-deployment). */
  TRUSTED_ORIGINS: isPreview ? previewHosts.map((h) => `https://${h}`) : [],
};
