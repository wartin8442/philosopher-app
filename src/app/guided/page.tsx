import { permanentRedirect } from "next/navigation";

/**
 * `/guided` was a placeholder that existed for one reason: to give the
 * homescreen's "Don't know where to start?" CTA somewhere to land instead of
 * 404ing while the matching mechanism was still an open design question
 * (docs/onboarding_philosopher_matching.md).
 *
 * That question is answered. The diagnostic router is built and lives at
 * `/start` (docs/diagnostic_routing_design.md, which supersedes the older
 * matching doc), and the CTA points there now.
 *
 * This route stays as a permanent redirect rather than being deleted, because
 * `/guided` has been the app's public "find your philosopher" URL for a while
 * and may be bookmarked or linked. `/start` is the canonical one.
 */
export default function GuidedPage() {
  permanentRedirect("/start");
}
