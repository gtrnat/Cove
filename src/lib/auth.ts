import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { provisionUser } from "@/features/settings/provision";

const REGISTRATION_CLOSED = "Registration is closed. Ask the owner of this Cove for an invite.";

export const auth = betterAuth({
  appName: "Cove",
  baseURL: env.APP_URL,
  trustedOrigins: env.TRUSTED_ORIGINS,
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    // Our tables are plural; map them to Better Auth's model names.
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      rateLimit: schema.rateLimits,
    },
    transaction: true,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    // No email provider yet (needs a custom domain), so no verification step.
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // never settable from sign-up or update requests
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh expiry at most once a day
    // Cookie cache stays off: with it, a signed-out or revoked session keeps
    // working until the cached cookie expires. Every check hits the sessions
    // table instead (once per request, deduped by React cache()).
    cookieCache: { enabled: false },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 5 },
      "/change-password": { window: 60, max: 5 },
    },
  },

  advanced: {
    // Vercel sets x-real-ip to the client address; x-forwarded-for chains are not trusted.
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase();
          const isAdmin = env.ADMIN_EMAILS.includes(email);
          // Closed registration still lets listed admins create their account.
          if (!env.ALLOW_REGISTRATION && !isAdmin) {
            throw new APIError("FORBIDDEN", { message: REGISTRATION_CLOSED, code: "REGISTRATION_CLOSED" });
          }
          return { data: { ...user, email, role: isAdmin ? "admin" : "user" } };
        },
        after: async (user) => {
          await provisionUser(user.id);
        },
      },
    },
  },

  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
