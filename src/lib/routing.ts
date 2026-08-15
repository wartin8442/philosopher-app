import { PHILOSOPHERS } from "@/lib/philosophers";
import { oppositePole as flipPole } from "@/lib/types";
import type { Approach, DiagnosticTopic, Philosopher, Pole } from "@/lib/types";

/**
 * Stages 1–2 and 4 of the diagnostic router: retrieve a topic pool, compose a
 * four-philosopher group from one pole of it, and check any proposed
 * reordering against the guardrails. See the Selection section of
 * docs/diagnostic_routing_design.md — this file implements exactly that
 * pseudocode's deterministic half.
 *
 * Stage 3 — the model's bounded rerank *within* a group — is the only part
 * that is not here, and by design it can only ever hand back a proposal that
 * `checkGuardrails` then accepts or throws away. The shelf renders with the
 * model unavailable; that is a requirement, not a fallback.
 *
 * Stages 1–2 are the layer the design calls "unrecoverable and invisible" if
 * wrong, and they are pinned test-for-test against the twenty author-approved
 * groups in docs/diagnostic_shelf_preview.md.
 *
 * This module imports `philosophers.ts` and must therefore stay on the server
 * — see philosopherDisplay.ts for why. The client flow receives the shelves
 * already narrowed to display records.
 */

/**
 * `Pole` and `oppositePole` are defined in types.ts — the client flow needs
 * them and must not import this module — and re-exported here because this is
 * where callers have always read them.
 */
export { oppositePole } from "@/lib/types";
export type { Pole } from "@/lib/types";

/** Four slots per group (D5). */
export const SLOTS_PER_GROUP = 4;

/** D3, as revised in v6: no approach may take more than ⌈slots/2⌉ slots. */
export function approachCap(slots: number = SLOTS_PER_GROUP): number {
  return Math.ceil(slots / 2);
}

/** The signed tag, or 0 when the philosopher is untagged on this topic. */
export function topicTag(
  philosopher: Philosopher,
  topic: DiagnosticTopic,
): number {
  return philosopher.topics?.[topic] ?? 0;
}

/**
 * Stage 1 — retrieve. Pool membership is |tag| >= 2; an absent tag means 1 or
 * 0 and is out. Returned in roster declaration order, which the fill rules
 * use as their final tie-break.
 */
export function topicPool(
  topic: DiagnosticTopic,
  roster: Philosopher[] = PHILOSOPHERS,
): Philosopher[] {
  return roster.filter((p) => Math.abs(topicTag(p, topic)) >= 2);
}

/** The pool members whose tag sits on the given pole. */
export function poleCandidates(
  topic: DiagnosticTopic,
  pole: Pole,
  roster: Philosopher[] = PHILOSOPHERS,
): Philosopher[] {
  const wanted = pole === "positive" ? 1 : -1;
  return topicPool(topic, roster).filter(
    (p) => Math.sign(topicTag(p, topic)) === wanted,
  );
}

/**
 * Fill `slots` from `candidates`, which must arrive in declaration order.
 *
 * Fit first: every tag-3 is considered before any tag-2, so a group never
 * trades topic fit for spread. Inside a tier, prefer the approach least
 * represented in the group so far (the diversity-aware tie-break adopted
 * 2026-08-14), skip anyone whose approach is already at the cap, and fall
 * back to declaration order.
 */
export function fillShelf(
  candidates: Philosopher[],
  topic: DiagnosticTopic,
  slots: number = SLOTS_PER_GROUP,
): Philosopher[] {
  const cap = approachCap(slots);
  const order = new Map(candidates.map((p, i) => [p.id, i]));
  const counts = new Map<Approach, number>();
  const chosen: Philosopher[] = [];

  const countOf = (p: Philosopher) =>
    p.approach ? (counts.get(p.approach) ?? 0) : 0;

  for (const tier of [3, 2]) {
    const tierPool = candidates.filter(
      (p) => Math.abs(topicTag(p, topic)) === tier,
    );

    while (chosen.length < slots) {
      const eligible = tierPool.filter(
        (p) => !chosen.includes(p) && countOf(p) < cap,
      );
      if (eligible.length === 0) break;

      const pick = eligible.reduce((best, p) => {
        const byApproach = countOf(p) - countOf(best);
        if (byApproach !== 0) return byApproach < 0 ? p : best;
        return (order.get(p.id) ?? 0) < (order.get(best.id) ?? 0) ? p : best;
      });

      chosen.push(pick);
      if (pick.approach) {
        counts.set(pick.approach, (counts.get(pick.approach) ?? 0) + 1);
      }
    }
  }

  return chosen;
}

/**
 * Authored per-shelf display orders. Presentation only: an entry must be a
 * permutation of the computed membership, never a different set. One exists
 * so far (design doc, Selection section; preview doc rulings log,
 * 2026-08-14) — `selfhood · core` renders Descartes first, moving Kierkegaard
 * off the front of the shelf.
 */
export const SHELF_DISPLAY_ORDER: Partial<
  Record<`${DiagnosticTopic}:${Pole}`, string[]>
> = {
  "selfhood:positive": ["descartes", "augustine", "kierkegaard", "plato"],
};

/** The membership of a group, in fill order (the lead first, always a tag-3). */
export function composeGroup(
  topic: DiagnosticTopic,
  pole: Pole,
  roster: Philosopher[] = PHILOSOPHERS,
  slots: number = SLOTS_PER_GROUP,
): Philosopher[] {
  return fillShelf(poleCandidates(topic, pole, roster), topic, slots);
}

/** The same group in the order it renders, applying any authored override. */
export function shelfFor(
  topic: DiagnosticTopic,
  pole: Pole,
  roster: Philosopher[] = PHILOSOPHERS,
  slots: number = SLOTS_PER_GROUP,
): Philosopher[] {
  const group = composeGroup(topic, pole, roster, slots);
  const authored = SHELF_DISPLAY_ORDER[`${topic}:${pole}`];
  if (!authored) return group;

  const byId = new Map(group.map((p) => [p.id, p]));
  const reordered = authored
    .map((id) => byId.get(id))
    .filter((p): p is Philosopher => Boolean(p));
  // A display order that does not cover the computed membership is an
  // authoring error, not a membership change — ignore it rather than ship a
  // short shelf.
  return reordered.length === group.length ? reordered : group;
}

/**
 * The whole shelf: the group on the user's side of the axis and the group on
 * the other one, four each (D5).
 *
 * `home`/`challenge` are roles, not identities — either pole can be either
 * role depending on the tally, which is why the copy in `diagnosticCopy.ts`
 * authors a pair of subtitles per group rather than one.
 */
export interface Shelf {
  topic: DiagnosticTopic;
  /** The pole the user's clicks landed on. */
  pole: Pole;
  home: Philosopher[];
  challenge: Philosopher[];
}

export function buildShelf(
  topic: DiagnosticTopic,
  pole: Pole,
  roster: Philosopher[] = PHILOSOPHERS,
  slots: number = SLOTS_PER_GROUP,
): Shelf {
  return {
    topic,
    pole,
    home: shelfFor(topic, pole, roster, slots),
    challenge: shelfFor(topic, flipPole(pole), roster, slots),
  };
}

/* -------------------------------------------------------------------------
 * Stage 4 — the guardrail layer
 * ---------------------------------------------------------------------- */

/**
 * The five properties any shelf must have before it renders, whether it came
 * from the deterministic fill or from the model's rerank
 * (docs/diagnostic_routing_design.md, "Stage 4 — the guardrail layer").
 *
 * These are checked rather than trusted because stage 3 is the one place a
 * model chooses anything, and every failure mode it has — hallucinating an id,
 * dropping a slot, putting the same person on both shelves, stacking four
 * rationalists — is cheap to detect and impossible to notice by eye.
 */
export type GuardrailFailure =
  | "wrong-size"
  | "unknown-id"
  | "in-both-groups"
  | "approach-over-cap"
  | "outside-pool";

export interface GuardrailResult {
  ok: boolean;
  /** Every rule that failed, for the log line the design asks stage 3 to keep. */
  failures: GuardrailFailure[];
}

export function checkGuardrails(
  shelf: Shelf,
  roster: Philosopher[] = PHILOSOPHERS,
  slots: number = SLOTS_PER_GROUP,
): GuardrailResult {
  const failures = new Set<GuardrailFailure>();
  const known = new Set(roster.map((p) => p.id));
  const cap = approachCap(slots);
  const groups: [Pole, Philosopher[]][] = [
    [shelf.pole, shelf.home],
    [flipPole(shelf.pole), shelf.challenge],
  ];

  for (const [pole, group] of groups) {
    if (group.length !== slots) failures.add("wrong-size");

    const eligible = new Set(poleCandidates(shelf.topic, pole, roster).map((p) => p.id));
    const counts = new Map<Approach, number>();

    for (const philosopher of group) {
      if (!known.has(philosopher.id)) failures.add("unknown-id");
      // A philosopher off the pole is the failure that matters most: it is the
      // model quietly overturning the tally, which D13 forbids outright.
      if (!eligible.has(philosopher.id)) failures.add("outside-pool");
      if (philosopher.approach) {
        const next = (counts.get(philosopher.approach) ?? 0) + 1;
        counts.set(philosopher.approach, next);
        if (next > cap) failures.add("approach-over-cap");
      }
    }
  }

  const homeIds = new Set(shelf.home.map((p) => p.id));
  if (shelf.challenge.some((p) => homeIds.has(p.id))) failures.add("in-both-groups");

  return { ok: failures.size === 0, failures: [...failures] };
}

/**
 * Apply a proposed ordering — the model's, or anything else's — only if it
 * survives the guardrails; otherwise fall back to the deterministic shelf.
 *
 * The proposal is a pair of id lists, which is the whole of what stage 3 is
 * allowed to return about membership. Ids it invents, drops, or moves across
 * the axis all land in `failures` and cost it the whole proposal: the design
 * specifies one retry with the failure fed back, then deterministic order, and
 * partial acceptance would make that retry unauditable.
 */
export function resolveShelf(
  topic: DiagnosticTopic,
  pole: Pole,
  proposal?: { home: string[]; challenge: string[] },
  roster: Philosopher[] = PHILOSOPHERS,
  slots: number = SLOTS_PER_GROUP,
): { shelf: Shelf; usedProposal: boolean; failures: GuardrailFailure[] } {
  const deterministic = buildShelf(topic, pole, roster, slots);
  if (!proposal) return { shelf: deterministic, usedProposal: false, failures: [] };

  const byId = new Map(roster.map((p) => [p.id, p]));
  const resolve = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((p): p is Philosopher => Boolean(p));

  const proposed: Shelf = {
    topic,
    pole,
    home: resolve(proposal.home),
    challenge: resolve(proposal.challenge),
  };

  // An id that resolved to nothing has already been dropped by `resolve`, so
  // the size rule catches it — but say it plainly, because "unknown id" and
  // "returned three people" are different bugs to chase.
  const unknown =
    proposal.home.length !== proposed.home.length ||
    proposal.challenge.length !== proposed.challenge.length;

  const result = checkGuardrails(proposed, roster, slots);
  const failures = unknown ? [...new Set<GuardrailFailure>([...result.failures, "unknown-id"])] : result.failures;

  if (failures.length > 0) {
    return { shelf: deterministic, usedProposal: false, failures };
  }
  return { shelf: proposed, usedProposal: true, failures: [] };
}
