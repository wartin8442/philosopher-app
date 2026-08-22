import { describe, expect, it } from "vitest";
import { BRANCHES, tallyPole, type BranchAnswer } from "@/lib/diagnostic";
import { CARD_HOOKS, GROUP_LABELS } from "@/lib/diagnosticCopy";
import { PHILOSOPHERS } from "@/lib/philosophers";
import {
  buildShelf,
  checkGuardrails,
  resolveShelf,
  shelfFor,
  type Shelf,
} from "@/lib/routing";
import {
  DIAGNOSTIC_TOPICS,
  oppositePole,
  type DiagnosticTopic,
  type Philosopher,
  type Pole,
} from "@/lib/types";

/**
 * The golden set (design doc, testing section, test #1) and the stage-4
 * guardrails.
 *
 * `diagnosticTags.test.ts` already proves the *fill* reproduces the twenty
 * author-approved groups. What this file proves is the step in front of it:
 * that a concrete pattern of clicks lands a user on the group the author
 * intended, including on the two branches whose tally has a documented
 * exception. Assertions are about membership, never rank — the order inside a
 * group is stage 3's to change and the display-order override's to overrule.
 */

/** Turn "acd" into the answers those clicks produce. */
function clicks(letters: string): BranchAnswer[] {
  return [...letters].map((letter) => ({ option: "abcd".indexOf(letter) }));
}

const ids = (list: { id: string }[]) => [...list.map((p) => p.id)].sort();

/**
 * Thirty hand-written answer profiles: three per topic, chosen to include a
 * clean sweep on each pole and at least one 2-1 split per topic where the
 * branch allows one. `home` is the group the user should land on, listed in
 * the preview doc's adopted-shelf order and compared as a set.
 */
const GOLDEN: {
  topic: DiagnosticTopic;
  clicks: string;
  pole: Pole;
  home: string[];
}[] = [
  /* 1 · What makes a life worth living */
  { topic: "sufficiency", clicks: "aca", pole: "negative",
    home: ["epicurus", "marcus-aurelius", "spinoza", "camus"] },
  { topic: "sufficiency", clicks: "bad", pole: "negative",
    home: ["epicurus", "marcus-aurelius", "spinoza", "camus"] },
  { topic: "sufficiency", clicks: "dbc", pole: "positive",
    home: ["nietzsche", "sartre", "aristotle", "hegel"] },
  { topic: "sufficiency", clicks: "abc", pole: "positive",
    home: ["nietzsche", "sartre", "aristotle", "hegel"] },

  /* 2 · Right and wrong — the three dilemmas, A/B found, C/D made */
  { topic: "moral_source", clicks: "acb", pole: "positive",
    home: ["aquinas", "aristotle", "kant", "mill"] },
  { topic: "moral_source", clicks: "adb", pole: "positive",
    home: ["aquinas", "aristotle", "kant", "mill"] },
  { topic: "moral_source", clicks: "cbd", pole: "negative",
    home: ["nietzsche", "sartre", "epicurus", "camus"] },
  { topic: "moral_source", clicks: "dda", pole: "negative",
    home: ["nietzsche", "sartre", "epicurus", "camus"] },

  /* 3 · Suffering, loss, death */
  { topic: "consolation", clicks: "aab", pole: "positive",
    home: ["epicurus", "marcus-aurelius", "aquinas", "augustine"] },
  { topic: "consolation", clicks: "cad", pole: "positive",
    home: ["epicurus", "marcus-aurelius", "aquinas", "augustine"] },
  { topic: "consolation", clicks: "ddc", pole: "negative",
    home: ["camus", "heidegger", "hume", "nietzsche"] },
  { topic: "consolation", clicks: "cba", pole: "negative",
    home: ["camus", "heidegger", "hume", "nietzsche"] },

  /* 4 · Who am I, really — two questions, Q1 authoritative on a tie */
  { topic: "selfhood", clicks: "aa", pole: "positive",
    home: ["descartes", "augustine", "kierkegaard", "plato"] },
  { topic: "selfhood", clicks: "ab", pole: "positive",
    home: ["descartes", "augustine", "kierkegaard", "plato"] },
  { topic: "selfhood", clicks: "cb", pole: "negative",
    home: ["sartre", "hume", "foucault", "nietzsche"] },
  { topic: "selfhood", clicks: "da", pole: "negative",
    home: ["sartre", "hume", "foucault", "nietzsche"] },

  /* 5 · Am I free */
  { topic: "agency", clicks: "cbc", pole: "positive",
    home: ["kierkegaard", "kant", "sartre", "nietzsche"] },
  { topic: "agency", clicks: "cbd", pole: "positive",
    home: ["kierkegaard", "kant", "sartre", "nietzsche"] },
  { topic: "agency", clicks: "aad", pole: "negative",
    home: ["spinoza", "marx", "augustine", "girard"] },
  { topic: "agency", clicks: "cad", pole: "negative",
    home: ["spinoza", "marx", "augustine", "girard"] },

  /* 6 · Why we accept the rules we're handed */
  { topic: "legitimacy", clicks: "cbc", pole: "positive",
    home: ["locke", "hegel", "mill", "plato"] },
  { topic: "legitimacy", clicks: "aad", pole: "negative",
    home: ["foucault", "heidegger", "marx", "nietzsche"] },
  { topic: "legitimacy", clicks: "dab", pole: "negative",
    home: ["foucault", "heidegger", "marx", "nietzsche"] },

  /* 7 · What's actually real */
  { topic: "depth", clicks: "bad", pole: "positive",
    home: ["plato", "spinoza", "epicurus", "augustine"] },
  { topic: "depth", clicks: "add", pole: "positive",
    home: ["plato", "spinoza", "epicurus", "augustine"] },
  { topic: "depth", clicks: "cbc", pole: "negative",
    home: ["wittgenstein", "hume", "heidegger", "nietzsche"] },

  /* 8 · How do we know anything */
  { topic: "standpoint", clicks: "acb", pole: "positive",
    home: ["plato", "descartes", "aristotle", "augustine"] },
  { topic: "standpoint", clicks: "cbc", pole: "negative",
    home: ["hume", "wittgenstein", "beauvoir", "hegel"] },

  /* 10 · Other people */
  { topic: "sociality", clicks: "acb", pole: "positive",
    home: ["aristotle", "hegel", "plato", "augustine"] },
  { topic: "sociality", clicks: "dbc", pole: "negative",
    home: ["girard", "beauvoir", "foucault", "nietzsche"] },

  /* 11 · Is there a God */
  { topic: "transcendence", clicks: "acb", pole: "positive",
    home: ["aquinas", "kierkegaard", "augustine", "descartes"] },
  { topic: "transcendence", clicks: "bda", pole: "negative",
    home: ["nietzsche", "camus", "sartre", "hume"] },
];

describe("the golden set", () => {
  it("covers every topic", () => {
    expect(new Set(GOLDEN.map((profile) => profile.topic)).size).toBe(
      DIAGNOSTIC_TOPICS.length,
    );
  });

  for (const profile of GOLDEN) {
    const name = `${profile.topic} · ${profile.clicks} → ${profile.pole}`;

    it(name, () => {
      const branch = BRANCHES[profile.topic];
      const answers = clicks(profile.clicks);
      expect(tallyPole(branch, answers)).toBe(profile.pole);

      const shelf = buildShelf(profile.topic, profile.pole);
      expect(ids(shelf.home)).toEqual([...profile.home].sort());
      // The challenge group is the other pole's, always, and never overlaps.
      expect(ids(shelf.challenge)).toEqual(
        ids(shelfFor(profile.topic, oppositePole(profile.pole))),
      );
      expect(
        shelf.challenge.filter((p) => profile.home.includes(p.id)),
      ).toHaveLength(0);
    });
  }
});

describe("checkGuardrails", () => {
  it("passes every deterministic shelf", () => {
    for (const topic of DIAGNOSTIC_TOPICS) {
      for (const pole of ["negative", "positive"] as Pole[]) {
        const result = checkGuardrails(buildShelf(topic, pole));
        expect(result.failures, `${topic}:${pole}`).toEqual([]);
      }
    }
  });

  const base = () => buildShelf("consolation", "positive");

  it("rejects a group that is not four people", () => {
    const shelf: Shelf = { ...base(), home: base().home.slice(0, 3) };
    expect(checkGuardrails(shelf).failures).toContain("wrong-size");
  });

  it("rejects a philosopher from the wrong pole", () => {
    const shelf = base();
    // Camus is on the *face* pole of this topic; putting him on the reframe
    // group is the model overturning the tally, which D13 forbids outright.
    const camus = shelf.challenge.find((p) => p.id === "camus")!;
    expect(
      checkGuardrails({ ...shelf, home: [...shelf.home.slice(0, 3), camus] }).failures,
    ).toContain("outside-pool");
  });

  it("rejects the same philosopher on both shelves", () => {
    const shelf = base();
    expect(
      checkGuardrails({ ...shelf, challenge: [...shelf.home] }).failures,
    ).toContain("in-both-groups");
  });

  it("rejects an unknown id", () => {
    const shelf = base();
    const ghost = { ...shelf.home[0], id: "zeno-of-nowhere" } as Philosopher;
    expect(
      checkGuardrails({ ...shelf, home: [...shelf.home.slice(0, 3), ghost] }).failures,
    ).toContain("unknown-id");
  });

  /**
   * The cap runs on a synthetic roster because no real pool has three members
   * of one approach on one pole that the fill would ever assemble — which is
   * the rule working, and is exactly why the check has to be written against
   * data that can break it.
   */
  it("rejects an approach over the cap", () => {
    const make = (id: string, approach: string, tag: number) =>
      ({ id, approach, topics: { depth: tag } }) as unknown as Philosopher;

    const home = [
      make("p1", "rational", 3),
      make("p2", "rational", 3),
      make("p3", "rational", 3),
      make("p4", "literary", 3),
    ];
    const challenge = [
      make("n1", "empirical", -3),
      make("n2", "experiential", -3),
      make("n3", "rational", -3),
      make("n4", "literary", -3),
    ];
    const roster = [...home, ...challenge];

    // Built by hand rather than by `buildShelf`, because the fill enforces the
    // cap itself and could never produce this shelf. Stage 3 can: the model is
    // handed four eligible candidates and asked to order them, and "the four
    // rationalists" is a perfectly plausible thing for it to hand back.
    const overloaded: Shelf = { topic: "depth", pole: "positive", home, challenge };
    expect(checkGuardrails(overloaded, roster).failures).toEqual([
      "approach-over-cap",
    ]);

    // Swapping one rationalist for the spread group's spare is the whole fix,
    // which is what makes this rule cheap to feed back on the retry.
    const fixed: Shelf = {
      ...overloaded,
      home: [home[0], home[1], home[3], make("p5", "empirical", 3)],
    };
    expect(checkGuardrails(fixed, [...roster, make("p5", "empirical", 3)]).ok).toBe(
      true,
    );
  });
});

describe("resolveShelf", () => {
  it("returns the deterministic shelf when there is no proposal", () => {
    const { shelf, usedProposal } = resolveShelf("depth", "negative");
    expect(usedProposal).toBe(false);
    expect(ids(shelf.home)).toEqual(ids(shelfFor("depth", "negative")));
  });

  it("accepts a legal reordering", () => {
    const deterministic = buildShelf("depth", "negative");
    const proposal = {
      home: [...deterministic.home].reverse().map((p) => p.id),
      challenge: deterministic.challenge.map((p) => p.id),
    };
    const { shelf, usedProposal } = resolveShelf("depth", "negative", proposal);
    expect(usedProposal).toBe(true);
    expect(shelf.home.map((p) => p.id)).toEqual(proposal.home);
  });

  it("throws away a proposal that fails a rule and falls back", () => {
    const deterministic = buildShelf("depth", "negative");
    const proposal = {
      home: deterministic.home.slice(0, 3).map((p) => p.id),
      challenge: deterministic.challenge.map((p) => p.id),
    };
    const { shelf, usedProposal, failures } = resolveShelf(
      "depth",
      "negative",
      proposal,
    );
    expect(usedProposal).toBe(false);
    expect(failures).toContain("wrong-size");
    expect(ids(shelf.home)).toEqual(ids(deterministic.home));
  });

  it("names a hallucinated id rather than only reporting a short group", () => {
    const deterministic = buildShelf("depth", "negative");
    const proposal = {
      home: [
        ...deterministic.home.slice(0, 3).map((p) => p.id),
        "zeno-of-nowhere",
      ],
      challenge: deterministic.challenge.map((p) => p.id),
    };
    const { usedProposal, failures } = resolveShelf("depth", "negative", proposal);
    expect(usedProposal).toBe(false);
    expect(failures).toContain("unknown-id");
  });

  it("refuses a proposal that moves someone across the axis", () => {
    const deterministic = buildShelf("depth", "negative");
    const proposal = {
      home: [
        ...deterministic.home.slice(0, 3).map((p) => p.id),
        deterministic.challenge[0].id,
      ],
      challenge: deterministic.challenge.map((p) => p.id),
    };
    const { usedProposal, failures } = resolveShelf("depth", "negative", proposal);
    expect(usedProposal).toBe(false);
    expect(failures).toContain("outside-pool");
  });
});

/**
 * The results screen renders a subtitle per group and a hook per card. A hole
 * degrades gracefully — the card falls back to the philosopher's `blurb` — but
 * it is still a hole, and it is invisible until someone happens to take that
 * path through the quiz.
 */
describe("results copy coverage", () => {
  it("has a home and a challenge subtitle for all twenty groups", () => {
    for (const topic of DIAGNOSTIC_TOPICS) {
      for (const pole of ["negative", "positive"] as Pole[]) {
        const labels = GROUP_LABELS[topic]?.[pole];
        expect(labels?.home?.length ?? 0, `${topic}:${pole} home`).toBeGreaterThan(20);
        expect(
          labels?.challenge?.length ?? 0,
          `${topic}:${pole} challenge`,
        ).toBeGreaterThan(20);
      }
    }
  });

  it("has a hook for everyone who can appear on a shelf", () => {
    for (const topic of DIAGNOSTIC_TOPICS) {
      for (const pole of ["negative", "positive"] as Pole[]) {
        for (const philosopher of shelfFor(topic, pole)) {
          expect(
            CARD_HOOKS[topic]?.[philosopher.id],
            `${topic}: ${philosopher.id}`,
          ).toBeTruthy();
        }
      }
    }
  });

  /**
   * The concentration ruling's condition 2: the two philosophers who appear on
   * many shelves must say something different on each, or the shelf stops
   * being a reason to meet them and becomes a recurring face.
   */
  it("gives Nietzsche and Augustine a distinct hook on every shelf", () => {
    for (const id of ["nietzsche", "augustine"]) {
      const hooks = DIAGNOSTIC_TOPICS.map((topic) => CARD_HOOKS[topic]?.[id]).filter(
        Boolean,
      );
      expect(hooks.length, id).toBeGreaterThan(4);
      expect(new Set(hooks).size, id).toBe(hooks.length);
    }
  });

  it("never calls Spinoza an atheist on the God shelf", () => {
    expect(CARD_HOOKS.transcendence.spinoza).toBeTruthy();
    expect(CARD_HOOKS.transcendence.spinoza.toLowerCase()).not.toMatch(
      /\bis an atheist\b|\bwas an atheist\b/,
    );
  });

  it("only names philosophers the roster actually has", () => {
    const known = new Set(PHILOSOPHERS.map((p) => p.id));
    for (const topic of DIAGNOSTIC_TOPICS) {
      for (const id of Object.keys(CARD_HOOKS[topic] ?? {})) {
        expect(known.has(id), `${topic}: ${id}`).toBe(true);
      }
    }
  });
});
