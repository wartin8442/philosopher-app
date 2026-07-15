import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/security/config";
import { getClientId } from "@/lib/security/clientId";
import { rateLimit } from "@/lib/security/rateLimit";

/**
 * Edge/runtime middleware applying two cross-cutting protections to every
 * request:
 *
 *   1. Security response headers (defense-in-depth against clickjacking, MIME
 *      sniffing, referrer leakage, and mixed content). The CSP is intentionally
 *      compatible with this app's needs — same-origin scripts/styles, remote
 *      book-cover images, and audio blobs — while forbidding framing and
 *      arbitrary connect targets.
 *   2. A coarse per-client backstop rate limit across ALL /api/* routes, to
 *      catch a flood that spreads itself thin across several endpoints (each of
 *      which also has its own tighter per-route limit).
 *
 * Body validation and per-route limits live in the route handlers, where the
 * parsed body is available; middleware only needs the client identity + path.
 */

// Next dev's HMR runtime uses eval(); production builds do not. Allow
// 'unsafe-eval' only outside production so the strict policy still ships live.
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Permissions-Policy":
    // Microphone is used for speech input; everything else is denied.
    "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    // Next.js injects inline bootstrap/runtime scripts; 'unsafe-inline' is
    // required without per-request nonces. Kept to script-src only.
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    // Book covers load from Open Library; portraits/data URIs from self.
    "img-src 'self' data: blob: https://covers.openlibrary.org",
    "media-src 'self' blob: data:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(name, value);
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const id = getClientId(req);
    const result = await rateLimit(`global:${id}`, RATE_LIMITS.global);
    if (!result.ok) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Too many requests. Please slow down and try again shortly." },
          {
            status: 429,
            headers: { "Retry-After": String(result.resetSeconds) },
          },
        ),
      );
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Apply to everything except Next's internal assets and static files. API
  // routes are included so the coarse limit and headers cover them too.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp3|woff2?)$).*)"],
};
