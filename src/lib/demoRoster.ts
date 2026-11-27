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
/**
 * Every philosopher with a written persona, released or not, in declaration
 * order. `philosophers.test.ts` pins this to `PHILOSOPHERS`, so it is also the
 * record of who is held back. Tests that exercise a held-back philosopher's
 * features run against this list (see `src/test/fullRoster.ts`).
 */
export const WRITTEN_PHILOSOPHER_IDS = [
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
  "girard",
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

/**
 * Serving every written persona. It was narrowed to Kierkegaard, Sartre, and
 * Camus on 2026-11-25 and widened back on 2026-11-26. To hold some back again,
 * replace this with an explicit list of ids; the type still requires each to
 * be a written persona.
 */
export const DEMO_ROSTER_IDS: readonly (typeof WRITTEN_PHILOSOPHER_IDS)[number][] =
  WRITTEN_PHILOSOPHER_IDS;

export const DEMO_ROSTER: ReadonlySet<string> = new Set(DEMO_ROSTER_IDS);

export function isDemoPhilosopherId(id: string): boolean {
  return DEMO_ROSTER.has(id);
}
