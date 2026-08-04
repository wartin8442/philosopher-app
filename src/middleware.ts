import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/security/config";
import { getClientId } from "@/lib/security/clientId";
import { rateLimit } from "@/lib/security/rateLimit";
import { isDemoPhilosopherId } from "@/lib/demoRoster";

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
    // covers.openlibrary.org only redirects: 302 to archive.org, which 302s
    // again to a numbered ia*.us.archive.org node. CSP is enforced on every
    // hop, so all three hosts must be listed or every cover is blocked and
    // silently falls back to the placeholder.
    "img-src 'self' data: blob: https://covers.openlibrary.org https://archive.org https://*.us.archive.org",
    "media-src 'self' blob: data:",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
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

/**
 * `/conversation/<id>` for a philosopher outside the demo roster.
 *
 * The page already refuses to render one, but it is a streamed client route:
 * by the time its `notFound()` runs the 200 is already on the wire, leaving a
 * soft 404. `/philosopher/<id>` is a server component and 404s correctly, so
 * hidden conversation URLs are rewritten onto it — same not-found page, real
 * status, no second copy of the roster check.
 */
function hiddenConversationId(pathname: string): string | null {
  const match = /^\/conversation\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return isDemoPhilosopherId(id) ? null : id;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hidden = hiddenConversationId(pathname);
  if (hidden) {
    return withSecurityHeaders(
      NextResponse.rewrite(new URL(`/philosopher/${hidden}`, req.url)),
    );
  }

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
