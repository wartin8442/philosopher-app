// Runs in the browser once, before the app hydrates (Next.js 15.3+).
// See src/lib/analytics.ts for why PostHog is configured the way it is.
import { initAnalytics } from "@/lib/analytics";

initAnalytics();
