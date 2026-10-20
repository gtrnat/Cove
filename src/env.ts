import "server-only";
import { z } from "zod";

/*
 * Server environment, validated once at startup so a missing or malformed
 * variable fails loudly instead of surfacing as a confusing runtime error.
 */
const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
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
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}\nSee .env.example.`);
}

export const env = parsed.data;
