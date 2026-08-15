/**
 * The philosophers the public demo serves.
 *
 * This lives apart from `philosophers.ts` so the middleware can consult the
 * roster without pulling the full persona module (every system prompt and
 * grounding excerpt) into the middleware bundle.
 *
 * Add an id here to release a philosopher: `DEMO_PHILOSOPHERS` and
 * `getDemoPhilosopher` in `philosophers.ts` both derive from this list, and
 * the middleware stops 404ing their pages.
 */
export const DEMO_ROSTER_IDS = [
  "aquinas",
  "nietzsche",
  "kierkegaard",
  "sartre",
  "camus",
  "hume",
  "plato",
  "aristotle",
  "epicurus",
  "marcus-aurelius",
  "augustine",
  "spinoza",
  "james",
  "beauvoir",
  "foucault",
  "descartes",
  "locke",
  "kant",
  "hegel",
  "mill",
  "marx",
  "heidegger",
  "wittgenstein",
] as const;

export const DEMO_ROSTER: ReadonlySet<string> = new Set(DEMO_ROSTER_IDS);

export function isDemoPhilosopherId(id: string): boolean {
  return DEMO_ROSTER.has(id);
}
