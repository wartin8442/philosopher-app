import Duel from "./Duel";
import { DEMO_PHILOSOPHERS } from "@/lib/philosophers";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";
import { isDemoPhilosopherId } from "@/lib/demoRoster";

/**
 * Server half of the duel route — the same split as the conversation route.
 * It resolves the roster down to the fields the picker and transcript render,
 * so the ~96KB persona module (24 system prompts plus their grounding
 * excerpts) never reaches the browser.
 *
 * Duel topics stay client-side: `getDuelTopics` keys off the pair the user
 * picks, and precomputing all 253 pairs would cost more than the table does.
 * `lib/starters.ts` no longer imports `philosophers.ts`, so that module now
 * ships on its own rather than pulling the personas along behind it.
 *
 * Everything interactive lives in ./Duel.tsx.
 */
interface PageProps {
  searchParams?: Promise<{ a?: string; b?: string }>;
}

export default async function DuelPage({ searchParams }: PageProps) {
  const { a, b } = searchParams ? await searchParams : {};

  // `?a=&b=` is how the diagnostic's results screen proposes a matchup. Both
  // ids must be on the demo roster and different from each other; anything
  // else is ignored rather than errored, because the picker below is perfectly
  // usable and a bad link should not cost the user the page.
  const pairIsUsable =
    Boolean(a && b) && a !== b && isDemoPhilosopherId(a!) && isDemoPhilosopherId(b!);

  return (
    <Duel
      philosophers={DEMO_PHILOSOPHERS.map(toPhilosopherDisplay)}
      initialPair={pairIsUsable ? { aId: a!, bId: b! } : undefined}
    />
  );
}
