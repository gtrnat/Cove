/**
 * Only allow same-site relative paths as post-login destinations, so
 * ?next=https://evil.example can't turn login into an open redirect.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
