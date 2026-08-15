import { describe, expect, it } from "vitest";
import { PHILOSOPHERS } from "@/lib/philosophers";
import {
  approachCap,
  composeGroup,
  poleCandidates,
  shelfFor,
  topicPool,
  topicTag,
} from "@/lib/routing";
import {
  DIAGNOSTIC_TOPICS,
  TOPIC_POLES,
  type Approach,
  type DiagnosticTopic,
} from "@/lib/types";
import type { Pole } from "@/lib/routing";

/**
 * The diagnostic tag matrix is an author artifact, transcribed into
 * `philosophers.ts` from docs/diagnostic_shelf_preview.md. Every value there
 * is a recorded ruling, so what has to be defended is not the values'
 * *reasonableness* but their *fidelity*: that the code still produces the
 * twenty groups the copy in diagnostic_shelf_copy.md was written against.
 *
 * The main test below is therefore the preview doc's "Adopted shelves" table
 * copied verbatim and recomputed from the tags. It fails on a mistyped tag, a
 * flipped pole, a reordered roster, or a changed fill rule.
 */

const ids = (list: { id: string }[]) => list.map((p) => p.id);

/**
 * docs/diagnostic_shelf_preview.md, "Adopted shelves — variant B tie-break +
 * all 2026-08-14 rulings". Row order, member order, and the approach counts
 * are the table's own.
 */
const ADOPTED_SHELVES: {
  topic: DiagnosticTopic;
  pole: Pole;
  label: string;
  shelf: string[];
  approaches: number;
}[] = [
  { topic: "sufficiency", pole: "negative", label: "worth · enough", approaches: 3,
    shelf: ["epicurus", "marcus-aurelius", "spinoza", "camus"] },
  { topic: "sufficiency", pole: "positive", label: "worth · more", approaches: 4,
    shelf: ["nietzsche", "sartre", "aristotle", "hegel"] },
  { topic: "moral_source", pole: "positive", label: "right · found", approaches: 2,
    shelf: ["aquinas", "aristotle", "kant", "mill"] },
  { topic: "moral_source", pole: "negative", label: "right · made", approaches: 3,
    shelf: ["nietzsche", "sartre", "epicurus", "camus"] },
  { topic: "consolation", pole: "positive", label: "suffer · reframe", approaches: 4,
    shelf: ["epicurus", "marcus-aurelius", "aquinas", "augustine"] },
  { topic: "consolation", pole: "negative", label: "suffer · face", approaches: 3,
    shelf: ["camus", "heidegger", "hume", "nietzsche"] },
  // Authored display order (see the display-order test below).
  { topic: "selfhood", pole: "positive", label: "self · core", approaches: 3,
    shelf: ["descartes", "augustine", "kierkegaard", "plato"] },
  { topic: "selfhood", pole: "negative", label: "self · no core", approaches: 3,
    shelf: ["sartre", "hume", "foucault", "nietzsche"] },
  { topic: "agency", pole: "positive", label: "free · makes", approaches: 3,
    shelf: ["kierkegaard", "kant", "sartre", "nietzsche"] },
  { topic: "agency", pole: "negative", label: "free · made", approaches: 3,
    shelf: ["spinoza", "marx", "augustine", "hume"] },
  { topic: "legitimacy", pole: "positive", label: "rules · consent", approaches: 3,
    shelf: ["locke", "hegel", "mill", "plato"] },
  { topic: "legitimacy", pole: "negative", label: "rules · conditioning", approaches: 3,
    shelf: ["foucault", "heidegger", "marx", "nietzsche"] },
  { topic: "transcendence", pole: "positive", label: "god · divine order", approaches: 2,
    shelf: ["aquinas", "kierkegaard", "augustine", "descartes"] },
  { topic: "transcendence", pole: "negative", label: "god · nothing beyond", approaches: 3,
    shelf: ["nietzsche", "camus", "sartre", "hume"] },
  { topic: "depth", pole: "positive", label: "real · something behind", approaches: 4,
    shelf: ["plato", "spinoza", "epicurus", "augustine"] },
  { topic: "depth", pole: "negative", label: "real · nothing behind", approaches: 3,
    shelf: ["wittgenstein", "hume", "heidegger", "nietzsche"] },
  { topic: "standpoint", pole: "positive", label: "know · objective", approaches: 4,
    shelf: ["plato", "descartes", "aristotle", "augustine"] },
  { topic: "standpoint", pole: "negative", label: "know · perspectival", approaches: 3,
    shelf: ["hume", "wittgenstein", "james", "beauvoir"] },
  { topic: "sociality", pole: "positive", label: "others · complete", approaches: 4,
    shelf: ["aristotle", "hegel", "plato", "augustine"] },
  { topic: "sociality", pole: "negative", label: "others · cost", approaches: 3,
    shelf: ["beauvoir", "nietzsche", "foucault", "kierkegaard"] },
];

/**
 * One tag-3 anchor per pole per topic, read straight off the preview doc's
 * matrix (`3·enough`, `3·more`, …). Their job is to make a silent inversion of
 * any axis impossible: flipping a topic's sign convention without flipping
 * these fails here as well as in the shelf test.
 */
const POLE_ANCHORS: Record<DiagnosticTopic, { negative: string; positive: string }> = {
  sufficiency: { negative: "epicurus", positive: "nietzsche" },
  moral_source: { negative: "nietzsche", positive: "aquinas" },
  consolation: { negative: "camus", positive: "epicurus" },
  selfhood: { negative: "sartre", positive: "descartes" },
  agency: { negative: "spinoza", positive: "kant" },
  legitimacy: { negative: "foucault", positive: "locke" },
  transcendence: { negative: "nietzsche", positive: "aquinas" },
  depth: { negative: "wittgenstein", positive: "plato" },
  standpoint: { negative: "hume", positive: "plato" },
  sociality: { negative: "beauvoir", positive: "aristotle" },
};

/** docs/diagnostic_routing_design.md, "Draft `approach` values". */
const APPROACH_TABLE: Record<Approach, string[]> = {
  rational: ["aquinas", "descartes", "spinoza", "kant", "hegel"],
  empirical: [
    "aristotle", "epicurus", "hume", "locke", "mill", "james", "marx", "foucault",
  ],
  experiential: ["augustine", "kierkegaard", "heidegger", "sartre", "beauvoir"],
  literary: ["plato", "marcus-aurelius", "nietzsche", "camus", "wittgenstein"],
};

/** The preview doc's appearance counts for the adopted shelves. */
const APPEARANCE_COUNTS: Record<string, number> = {
  nietzsche: 9, augustine: 7, hume: 6, sartre: 5, plato: 5,
  aristotle: 4, epicurus: 4, camus: 4, kierkegaard: 4,
  aquinas: 3, spinoza: 3, hegel: 3, heidegger: 3, descartes: 3, foucault: 3,
  "marcus-aurelius": 2, kant: 2, mill: 2, marx: 2, wittgenstein: 2, beauvoir: 2,
  locke: 1, james: 1,
};

describe("the pole convention", () => {
  it("reads negative as the first-named pole of each axis", () => {
    // If these labels are ever reworded, the anchors below are what proves the
    // *sign* did not move with the words.
    expect(TOPIC_POLES.transcendence.negative).toBe("nothing beyond nature");
    expect(TOPIC_POLES.transcendence.positive).toBe("a divine order");
    expect(TOPIC_POLES.sociality.negative).toBe("others cost you yourself");
    expect(TOPIC_POLES.agency.negative).toBe("made");
    expect(TOPIC_POLES.moral_source.positive).toBe("found");
  });

  it.each(DIAGNOSTIC_TOPICS)("pins both poles of %s to a tag-3 anchor", (topic) => {
    const anchors = POLE_ANCHORS[topic];
    const tagOf = (id: string) => {
      const philosopher = PHILOSOPHERS.find((p) => p.id === id);
      expect(philosopher, `no philosopher ${id}`).toBeDefined();
      return topicTag(philosopher!, topic);
    };

    expect(tagOf(anchors.negative)).toBe(-3);
    expect(tagOf(anchors.positive)).toBe(3);
  });
});

describe("the transcribed matrix", () => {
  it("tags every philosopher on the main roster", () => {
    expect(PHILOSOPHERS).toHaveLength(23);
    for (const philosopher of PHILOSOPHERS) {
      expect(philosopher.approach, philosopher.id).toBeDefined();
      expect(philosopher.topics, philosopher.id).toBeDefined();
    }
  });

  it("assigns each philosopher the design doc's approach", () => {
    for (const [approach, members] of Object.entries(APPROACH_TABLE)) {
      const actual = PHILOSOPHERS.filter((p) => p.approach === approach).map((p) => p.id);
      expect(actual.slice().sort()).toEqual(members.slice().sort());
    }
  });

  it("records only magnitudes 2 and 3 — 1 and 0 are the absent key", () => {
    for (const philosopher of PHILOSOPHERS) {
      for (const [topic, tag] of Object.entries(philosopher.topics ?? {})) {
        expect(DIAGNOSTIC_TOPICS).toContain(topic);
        expect(Math.abs(tag), `${philosopher.id}.${topic}`).toBeGreaterThanOrEqual(2);
        expect(Math.abs(tag), `${philosopher.id}.${topic}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("holds Kant out of the depth pool (ruling of 2026-08-14)", () => {
    // screen2_split_questions_draft.md §7: his prompt forbids treating the
    // noumenal as a second describable world, and after Q2–Q3 he was the
    // branch's only pool member with no route. He is on neither depth shelf
    // either way, so the shelf table above is unaffected.
    const kant = PHILOSOPHERS.find((p) => p.id === "kant");
    expect(kant?.topics?.depth).toBeUndefined();
    expect(ids(topicPool("depth"))).not.toContain("kant");
  });

  // The preview doc's own sanity checks.

  it("gives no philosopher more than three 3s (finding E's scarcity rule)", () => {
    for (const philosopher of PHILOSOPHERS) {
      const threes = Object.values(philosopher.topics ?? {}).filter(
        (tag) => Math.abs(tag) === 3,
      );
      expect(threes.length, philosopher.id).toBeLessThanOrEqual(3);
    }
  });

  it("puts every philosopher in at least one pool", () => {
    for (const philosopher of PHILOSOPHERS) {
      const pools = DIAGNOSTIC_TOPICS.filter((topic) =>
        ids(topicPool(topic)).includes(philosopher.id),
      );
      expect(pools.length, `${philosopher.id} is unreachable`).toBeGreaterThan(0);
    }
  });

  it.each(DIAGNOSTIC_TOPICS)("splits the %s pool across both poles", (topic) => {
    expect(poleCandidates(topic, "negative").length).toBeGreaterThan(0);
    expect(poleCandidates(topic, "positive").length).toBeGreaterThan(0);
  });
});

describe("the adopted shelves", () => {
  it("covers all twenty groups", () => {
    expect(ADOPTED_SHELVES).toHaveLength(DIAGNOSTIC_TOPICS.length * 2);
  });

  it.each(ADOPTED_SHELVES)(
    "reproduces $label member-for-member and in order",
    ({ topic, pole, shelf }) => {
      expect(ids(shelfFor(topic, pole))).toEqual(shelf);
    },
  );

  it.each(ADOPTED_SHELVES)(
    "spans $approaches approaches on $label",
    ({ topic, pole, approaches }) => {
      const spread = new Set(shelfFor(topic, pole).map((p) => p.approach));
      expect(spread.size).toBe(approaches);
      expect(spread.size).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(ADOPTED_SHELVES)(
    "keeps $label inside the per-approach cap",
    ({ topic, pole }) => {
      const counts = new Map<string, number>();
      for (const philosopher of shelfFor(topic, pole)) {
        const approach = philosopher.approach!;
        counts.set(approach, (counts.get(approach) ?? 0) + 1);
      }
      for (const count of counts.values()) {
        expect(count).toBeLessThanOrEqual(approachCap());
      }
    },
  );

  it.each(ADOPTED_SHELVES)("leads $label with a tag-3", ({ topic, pole }) => {
    // Fit-first ranking guarantees this, and condition 1 of the concentration
    // ruling depends on it: Nietzsche must never lead a shelf he is a 2 on.
    const [lead] = composeGroup(topic, pole);
    expect(Math.abs(topicTag(lead, topic))).toBe(3);
  });

  it("matches the preview doc's appearance counts", () => {
    const counts: Record<string, number> = {};
    for (const { topic, pole } of ADOPTED_SHELVES) {
      for (const philosopher of shelfFor(topic, pole)) {
        counts[philosopher.id] = (counts[philosopher.id] ?? 0) + 1;
      }
    }
    expect(counts).toEqual(APPEARANCE_COUNTS);
  });
});

describe("the authored display order", () => {
  it("reorders selfhood · core without changing what the fill produced", () => {
    // Rulings log, 2026-08-14 addendum: the deterministic fill leads with
    // Kierkegaard; the author moved Descartes to the front. Presentation only.
    const filled = ids(composeGroup("selfhood", "positive"));
    const rendered = ids(shelfFor("selfhood", "positive"));

    expect(filled).toEqual(["kierkegaard", "descartes", "augustine", "plato"]);
    expect(rendered).toEqual(["descartes", "augustine", "kierkegaard", "plato"]);
    expect(rendered.slice().sort()).toEqual(filled.slice().sort());
  });

  it("leaves every other shelf in fill order", () => {
    for (const { topic, pole } of ADOPTED_SHELVES) {
      if (topic === "selfhood" && pole === "positive") continue;
      expect(ids(shelfFor(topic, pole))).toEqual(ids(composeGroup(topic, pole)));
    }
  });
});
