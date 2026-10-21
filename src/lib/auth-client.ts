"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

// Same-origin: the client calls /api/auth/* on whatever host serves the app.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

/** Human-friendly message for a Better Auth client error. */
export function authErrorMessage(
  error: { status?: number; code?: string; message?: string } | null | undefined,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error) return fallback;
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match.";
    case "REGISTRATION_CLOSED":
      return "Registration is closed. Ask the owner of this Cove for an invite.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists.";
    case "INVALID_PASSWORD":
      return "Your current password is incorrect.";
    case "PASSWORD_TOO_SHORT":
      return "Password must be at least 8 characters.";
    case "PASSWORD_TOO_LONG":
      return "Password is too long.";
    default:
      return error.message || fallback;
  }
}
