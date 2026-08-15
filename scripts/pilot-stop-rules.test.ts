import { describe, expect, it } from "vitest";
import { classifyConditionBOutcome, type StopRuleInput } from "./pilot-stop-rules";
import type { FrozenCheck } from "./pilot-manifest";

const CHECKS: FrozenCheck[] = [
  { id: "q-c1", pass_if: "names the journal", severity: "critical" },
  { id: "q-c2", pass_if: "names the reviewer", severity: "major" },
];

function input(overrides: Partial<StopRuleInput> = {}): StopRuleInput {
  return {
    questionId: "sartre-q35",
    philosopher: "sartre",
    relevantCorpus: ["quote: Fascism is not defined by the number of its victims"],
    frozenChecks: CHECKS,
    retrievedSources: [],
    allowedSourceIds: new Set(["source:sartre:1", "quote:sartre:liberation-1953:fascism"]),
    mappedEligibleIds: [],
    verdicts: [
      { id: "q-c1", verdict: "pass" },
      { id: "q-c2", verdict: "pass" },
    ],
    baselinePassedCheckIds: new Set(["q-c1", "q-c2"]),
    ...overrides,
  };
}

describe("content anomalies never stop the run", () => {
  it("logs a new critical failure instead of halting", () => {
    const outcome = classifyConditionBOutcome(input({
      verdicts: [{ id: "q-c1", verdict: "fail" }, { id: "q-c2", verdict: "pass" }],
    }));

    // This is the exact r9 situation: q35-c2 passed in the baseline, failed on
    // one sample, and passed again on a fresh isolated sample of the identical
    // prompt. Halting there cost 27 already-clean records.
    expect(outcome.mechanism).toBeNull();
    expect(outcome.anomalies).toHaveLength(1);
    expect(outcome.anomalies[0].code).toBe("new_critical_failure");
    expect(outcome.anomalies[0].severity).toBe("critical");
  });

  it("records an ordinary failed check without calling it a new critical failure", () => {
    const outcome = classifyConditionBOutcome(input({
      verdicts: [{ id: "q-c1", verdict: "pass" }, { id: "q-c2", verdict: "fail" }],
    }));

    expect(outcome.mechanism).toBeNull();
    expect(outcome.anomalies.map((anomaly) => anomaly.code)).toEqual(["check_failed"]);
  });

  it("does not call a critical failure new when the baseline already failed it", () => {
    const outcome = classifyConditionBOutcome(input({
      verdicts: [{ id: "q-c1", verdict: "fail" }],
      baselinePassedCheckIds: new Set(["q-c2"]),
    }));

    expect(outcome.anomalies.map((anomaly) => anomaly.code)).toEqual(["check_failed"]);
  });

  it("reports nothing when every check passes", () => {
    const outcome = classifyConditionBOutcome(input());
    expect(outcome.mechanism).toBeNull();
    expect(outcome.anomalies).toEqual([]);
  });
});

describe("mechanism violations pause spend", () => {
  it("flags a cross-philosopher source leak", () => {
    const outcome = classifyConditionBOutcome(input({
      retrievedSources: [{ id: "quote:nietzsche:bge-146:x", philosopher: "nietzsche" }],
    }));
    expect(outcome.mechanism?.code).toBe("cross_philosopher_source");
  });

  it("flags an ineligible or unknown source", () => {
    const outcome = classifyConditionBOutcome(input({
      retrievedSources: [{ id: "card:sartre:the-cafe-waiter", philosopher: "sartre" }],
    }));
    expect(outcome.mechanism?.code).toBe("ineligible_source");
  });

  it("flags injection on a designated empty-support question", () => {
    const outcome = classifyConditionBOutcome(input({
      relevantCorpus: [],
      retrievedSources: [{ id: "source:sartre:1", philosopher: "sartre" }],
    }));
    expect(outcome.mechanism?.code).toBe("empty_support_injection");
  });

  it("flags a mapped-support miss and reports what was expected", () => {
    const outcome = classifyConditionBOutcome(input({
      mappedEligibleIds: ["quote:sartre:liberation-1953:fascism"],
      retrievedSources: [],
    }));
    expect(outcome.mechanism?.code).toBe("mapped_support_missed");
    expect(outcome.mechanism?.message).toContain("quote:sartre:liberation-1953:fascism");
    expect(outcome.retrievedMappedIds).toEqual([]);
  });

  it("accepts a record that retrieved its mapped support", () => {
    const outcome = classifyConditionBOutcome(input({
      mappedEligibleIds: ["quote:sartre:liberation-1953:fascism"],
      retrievedSources: [{ id: "quote:sartre:liberation-1953:fascism", philosopher: "sartre" }],
    }));
    expect(outcome.mechanism).toBeNull();
    expect(outcome.retrievedMappedIds).toEqual(["quote:sartre:liberation-1953:fascism"]);
  });

  it("still reports content anomalies alongside a mechanism violation", () => {
    const outcome = classifyConditionBOutcome(input({
      relevantCorpus: [],
      retrievedSources: [{ id: "source:sartre:1", philosopher: "sartre" }],
      verdicts: [{ id: "q-c1", verdict: "fail" }],
    }));
    expect(outcome.mechanism?.code).toBe("empty_support_injection");
    expect(outcome.anomalies).toHaveLength(1);
  });
});
