import { fileURLToPath } from "node:url";

// PostHog is reached through this app's own origin (/ingest) so the CSP can
// stay `connect-src 'self'` and ad blockers do not silently drop the counts.
// See src/lib/analytics.ts.
const posthogRegion = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep output tracing inside this project when another lockfile exists in a
  // parent directory; otherwise Next may infer the user's home as the root.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  // The embedding library loads a native ONNX runtime (.node binaries) that
  // webpack cannot bundle; load it from node_modules at runtime instead.
  serverExternalPackages: ["@xenova/transformers"],
  // PostHog's API paths end in a slash; Next's redirect would break them.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `https://${posthogRegion}-assets.i.posthog.com/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `https://${posthogRegion}.i.posthog.com/:path*`,
      },
    ];
  },
};

export default nextConfig;
