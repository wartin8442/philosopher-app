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
 * Narrowed to the three existentialists while they are built out further.
 * The other twenty are fully implemented and only held back here; the git tag
 * `full-roster-23` marks the last commit that served all of them. Add an id
 * back (or set this to `WRITTEN_PHILOSOPHER_IDS`) to release it.
 */
export const DEMO_ROSTER_IDS = [
  "kierkegaard",
  "sartre",
  "camus",
] as const satisfies readonly (typeof WRITTEN_PHILOSOPHER_IDS)[number][];

export const DEMO_ROSTER: ReadonlySet<string> = new Set(DEMO_ROSTER_IDS);

export function isDemoPhilosopherId(id: string): boolean {
  return DEMO_ROSTER.has(id);
}
