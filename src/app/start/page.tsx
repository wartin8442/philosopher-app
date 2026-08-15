import DiagnosticFlow, { type ShelfGroups } from "@/components/DiagnosticFlow";
import { PHILOSOPHERS } from "@/lib/philosophers";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";
import { shelfFor } from "@/lib/routing";
import { DIAGNOSTIC_TOPICS } from "@/lib/types";

export const metadata = {
  title: "Where to start",
  description:
    "Answer a few questions and meet eight philosophers worth your time — four near where you start, four who will argue with it.",
};

/**
 * Server half of the diagnostic router (docs/diagnostic_routing_design.md).
 *
 * It precomputes **all twenty groups** — ten topics × two poles, four
 * philosophers each — and hands them to the client as display records. Two
 * reasons it works this way rather than fetching a shelf after the tally:
 *
 *   1. `lib/routing.ts` imports `lib/philosophers.ts`, ~96KB of system prompt
 *      the browser must never receive (see philosopherDisplay.ts). Selection
 *      has to happen here.
 *   2. The design's hardest requirement on this feature is that **the shelf
 *      must render with the model unavailable**. Eighty small records shipped
 *      with the page make the whole flow — topic to results — a pure function
 *      of clicks, with no network call anywhere in it. A fetch-after-tally
 *      would be leaner and would put an outage between the user and their
 *      answer.
 *
 * The stage-3 rerank, when it is built, layers on top of this: it can reorder
 * a group the user already has, and `resolveShelf` throws its proposal away if
 * it fails the guardrails.
 */
export default function StartPage() {
  const groups = Object.fromEntries(
    DIAGNOSTIC_TOPICS.map((topic) => [
      topic,
      {
        negative: shelfFor(topic, "negative").map(toCard),
        positive: shelfFor(topic, "positive").map(toCard),
      },
    ]),
  ) as ShelfGroups;

  return <DiagnosticFlow groups={groups} />;
}

/** The display projection plus `blurb`, which the shelf card falls back to. */
function toCard(philosopher: (typeof PHILOSOPHERS)[number]) {
  return { ...toPhilosopherDisplay(philosopher), blurb: philosopher.blurb };
}
