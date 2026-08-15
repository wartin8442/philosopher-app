import { describe, expect, it } from "vitest";
import {
  BRANCHES,
  INTENT_QUESTION,
  PERSUASION_QUESTION,
  TOPIC_GROUPS,
  TOPIC_LABELS,
  isMixedPattern,
  routePattern,
  tallyPole,
  type Branch,
  type BranchAnswer,
} from "@/lib/diagnostic";
import { buildSubmission } from "@/lib/diagnosticSubmission";
import { DIAGNOSTIC_TOPICS } from "@/lib/types";

/**
 * The instrument's structural invariants, and the tally.
 *
 * The wordings themselves are author-approved and are not asserted here — a
 * test that pinned prose would fail on every approved edit and teach the next
 * reader to update it without thinking. What is pinned is the *shape* the
 * design argues for: four routed options per question, both poles reachable
 * from every question, routes constant across a branch, and an option order
 * scrambled hard enough that clicking the same letter three times cannot
 * produce a clean pole.
 */

/** Turn "acd" into the answers those clicks produce. */
function clicks(letters: string): BranchAnswer[] {
  return [...letters].map((letter) => ({ option: "abcd".indexOf(letter) }));
}

const branches = Object.values(BRANCHES);

describe("the ten branches", () => {
  it("covers every topic once, and nothing else", () => {
    expect(Object.keys(BRANCHES).sort()).toEqual([...DIAGNOSTIC_TOPICS].sort());
    for (const topic of DIAGNOSTIC_TOPICS) {
      expect(BRANCHES[topic].topic).toBe(topic);
    }
  });

  it("runs three questions, except selfhood's documented two", () => {
    for (const branch of branches) {
      const expected = branch.topic === "selfhood" ? 2 : 3;
      expect(branch.questions.length, branch.topic).toBe(expected);
    }
  });

  it("declares a tiebreak question exactly where a tie is reachable", () => {
    for (const branch of branches) {
      const canTie = branch.questions.length % 2 === 0;
      expect(branch.tiebreakQuestion !== undefined, branch.topic).toBe(canTie);
    }
  });

  it("gives every question four options, keyed a–d", () => {
    for (const branch of branches) {
      for (const question of branch.questions) {
        expect(question.options.map((option) => option.key)).toEqual([
          "a",
          "b",
          "c",
          "d",
        ]);
      }
    }
  });

  it("puts two options on each pole of every question (D8, no safe middles)", () => {
    for (const branch of branches) {
      for (const question of branch.questions) {
        const negative = question.options.filter((o) => o.pole === "negative");
        expect(negative.length, `${branch.topic}: ${question.prompt}`).toBe(2);
      }
    }
  });

  it("carries the same four routes through every question of a branch", () => {
    for (const branch of branches) {
      const routes = branch.questions.map((question) =>
        question.options.map((option) => option.route).sort(),
      );
      expect(new Set(routes[0]).size, branch.topic).toBe(4);
      for (const set of routes) expect(set, branch.topic).toEqual(routes[0]);
    }
  });

  it("keeps each route on one pole for the whole branch", () => {
    for (const branch of branches) {
      const poleOf = new Map<string, string>();
      for (const question of branch.questions) {
        for (const option of question.options) {
          const seen = poleOf.get(option.route);
          if (seen) expect(seen, `${branch.topic}/${option.route}`).toBe(option.pole);
          else poleOf.set(option.route, option.pole);
        }
      }
    }
  });

  /**
   * Checklist rule 13. A user who clicks (c) three times without reading has
   * told the instrument nothing, and must not be handed a confident pole for
   * it. `selfhood` is exempt and cannot comply: two questions with two options
   * per pole leave no room to scramble, which is part of why that branch needs
   * an explicit tiebreak rule at all.
   */
  it("makes straight-lining impossible on the three-question branches", () => {
    for (const branch of branches) {
      if (branch.questions.length < 3) continue;
      for (const letter of "abcd") {
        const poles = branch.questions.map(
          (question) => question.options["abcd".indexOf(letter)].pole,
        );
        expect(new Set(poles).size, `${branch.topic}: all ${letter}`).toBeGreaterThan(1);
      }
    }
  });
});

describe("screen 1", () => {
  it("offers all ten topics, grouped, with a label each", () => {
    const listed = TOPIC_GROUPS.flatMap((group) => group.choices).map((c) => c.topic);
    expect(listed.sort()).toEqual([...DIAGNOSTIC_TOPICS].sort());
    for (const topic of DIAGNOSTIC_TOPICS) {
      expect(TOPIC_LABELS[topic]?.length ?? 0, topic).toBeGreaterThan(10);
    }
  });
});

describe("the universal questions", () => {
  it("reaches all four approaches exactly once", () => {
    const approaches = PERSUASION_QUESTION.options.map((o) => o.approach);
    expect(new Set(approaches).size).toBe(4);
  });

  it("offers all four answer levels, and leads with the challenge group once", () => {
    const levels = INTENT_QUESTION.options.map((o) => o.level);
    expect(new Set(levels).size).toBe(4);
    const challengeFirst = INTENT_QUESTION.options.filter(
      (o) => o.leadWith === "challenge",
    );
    expect(challengeFirst.map((o) => o.key)).toEqual(["c"]);
  });
});

describe("tallyPole", () => {
  it("takes the majority of the three clicks", () => {
    // sufficiency Q1 (a) enough, Q2 (c) enough, Q3 (a) more → 2-1 enough.
    expect(tallyPole(BRANCHES.sufficiency, clicks("aca"))).toBe("negative");
    // …and the mirror.
    expect(tallyPole(BRANCHES.sufficiency, clicks("dbc"))).toBe("positive");
  });

  it("reads a clean sweep as that pole", () => {
    expect(tallyPole(BRANCHES.legitimacy, clicks("cbc"))).toBe("positive");
    expect(tallyPole(BRANCHES.legitimacy, clicks("aad"))).toBe("negative");
  });

  /**
   * Draft doc §4's ruling. Both of these tie 1-1, and Q1 decides — without
   * this the branch would have to hand the pole to the model, which D13
   * forbids.
   */
  it("breaks selfhood's 1-1 tie with question 1", () => {
    expect(tallyPole(BRANCHES.selfhood, clicks("ab"))).toBe("positive");
    expect(tallyPole(BRANCHES.selfhood, clicks("da"))).toBe("negative");
    // Sanity: the same clicks in the other order really are a tie, so the
    // assertions above are testing the rule and not an accidental majority.
    expect(isMixedPattern(BRANCHES.selfhood, clicks("ab"))).toBe(true);
  });

  /**
   * Draft doc §5's ruling of 2026-08-14: plain majority, no weighting for the
   * first-person questions. When Q1 and Q3 split, the third-person Q2 decides.
   */
  it("lets agency's Q2 decide when the first-person questions split", () => {
    // Q1 (c) makes-himself, Q3 (d) made → split; Q2 (a) made carries it.
    expect(tallyPole(BRANCHES.agency, clicks("cad"))).toBe("negative");
    // Same split, Q2 the other way.
    expect(tallyPole(BRANCHES.agency, clicks("cbd"))).toBe("positive");
  });

  it("reports a mixed pattern as mixed", () => {
    expect(isMixedPattern(BRANCHES.agency, clicks("cad"))).toBe(true);
    expect(isMixedPattern(BRANCHES.agency, clicks("cbc"))).toBe(false);
  });

  it("returns a pole from partial answers rather than throwing", () => {
    expect(["negative", "positive"]).toContain(
      tallyPole(BRANCHES.depth, [{ option: 0 }]),
    );
    expect(["negative", "positive"]).toContain(tallyPole(BRANCHES.depth, []));
  });
});

describe("routePattern", () => {
  it("returns the route of each click, in question order", () => {
    expect(routePattern(BRANCHES.transcendence, clicks("acb"))).toEqual([
      "transcendent · reasoned",
      "transcendent · reasoned",
      "transcendent · reasoned",
    ]);
  });

  it("skips questions with no click rather than inventing one", () => {
    expect(routePattern(BRANCHES.transcendence, [{ option: 0 }])).toHaveLength(1);
  });
});

/**
 * The safety design's §11 rule, tested through the real submission path rather
 * than through `disposeFreeText` alone: a flagged answer's text must be absent
 * from everything that leaves the browser.
 */
describe("buildSubmission and free text", () => {
  const intent = INTENT_QUESTION.options[1];
  const branch: Branch = BRANCHES.consolation;

  const distress = "Honestly I can't keep going after this.";
  const ordinary = "My father died last spring and nothing anyone said helped.";

  it("passes ordinary text to the model and lets it seed a conversation", () => {
    const submission = buildSubmission(
      branch,
      [{ option: 3, text: ordinary }, { option: 1 }, { option: 2 }],
      "literary",
      intent,
    );
    expect(submission.textForModel).toEqual([{ question: 0, text: ordinary }]);
    expect(submission.conversationSeed).toBe(ordinary);
    expect(submission.branchFlagged).toBe(false);
  });

  it("withholds a flagged answer from the model, the seed, and analytics", () => {
    const submission = buildSubmission(
      branch,
      [{ option: 3, text: distress }, { option: 1 }, { option: 2 }],
      "literary",
      intent,
    );
    expect(submission.textForModel).toEqual([]);
    expect(submission.conversationSeed).toBeUndefined();
    expect(submission.branchFlagged).toBe(true);
    expect(JSON.stringify(submission.analytics)).not.toContain("keep going");
    expect(submission.analytics.answers[0]).toEqual({
      hadText: true,
      flagged: true,
      category: "inability",
    });
  });

  it("still routes the flagged user to the same shelf", () => {
    const answers: BranchAnswer[] = [{ option: 3 }, { option: 1 }, { option: 2 }];
    const clean = buildSubmission(branch, answers, "literary", intent);
    const flagged = buildSubmission(
      branch,
      answers.map((a, i) => (i === 0 ? { ...a, text: distress } : a)),
      "literary",
      intent,
    );
    expect(flagged.pole).toBe(clean.pole);
    expect(flagged.routes).toEqual(clean.routes);
  });

  it("withholds only the answer that flagged, not the whole branch", () => {
    const submission = buildSubmission(
      branch,
      [
        { option: 3, text: distress },
        { option: 1, text: ordinary },
        { option: 2 },
      ],
      "literary",
      intent,
    );
    expect(submission.textForModel).toEqual([{ question: 1, text: ordinary }]);
    expect(submission.branchFlagged).toBe(true);
  });

  it("records the clicks and the intent for test #8's distributions", () => {
    const submission = buildSubmission(
      branch,
      [{ option: 3 }, { option: 1 }, { option: 2 }],
      "experiential",
      INTENT_QUESTION.options[2],
    );
    expect(submission.analytics.options).toEqual([3, 1, 2]);
    expect(submission.approach).toBe("experiential");
    expect(submission.level).toBe("advanced");
    expect(submission.leadWith).toBe("challenge");
  });
});
