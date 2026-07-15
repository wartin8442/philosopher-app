/**
 * Derive a stable client identity for rate limiting from request headers.
 *
 * On Vercel (and most reverse proxies) the originating client IP is the first
 * entry of `x-forwarded-for`; the platform sets it and strips client-supplied
 * copies at the edge, so it is trustworthy there. Locally there is no proxy,
 * so we fall back through a few common headers and finally to a shared
 * "unknown" bucket (which simply means unidentified clients share one limit —
 * fail-safe, never fail-open to unlimited).
 *
 * Note: `x-forwarded-for` is spoofable when the app is exposed WITHOUT a
 * trusted proxy in front. This app is deployed behind Vercel's edge, which
 * overwrites the header, so spoofing does not apply in production. The
 * platform-level runbook (docs/SECURITY.md) covers the WAF/BotID layer that
 * backstops IP-based limits.
 */
export function getClientId(req: Request): string {
  const headers = req.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // First hop is the real client; the rest are proxies.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const candidates = ["x-real-ip", "x-vercel-forwarded-for", "cf-connecting-ip"];
  for (const name of candidates) {
    const value = headers.get(name)?.trim();
    if (value) return value;
  }
  return "unknown";
}
