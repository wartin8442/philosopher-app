import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PILOT_RUNS_RELATIVE_ROOT } from "./pilot-harness";
import {
  buildReviewRecords,
  summarizeProgress,
  validateDecision,
} from "./review-records";
import type { PilotManifest } from "./pilot-manifest";

const MANIFEST = {
  questions: [{
    id: "kg-05",
    philosopher: "kierkegaard",
    checks: [
      { id: "kg-05-c1", pass_if: "names Mynster and Martensen", severity: "critical" },
      { id: "kg-05-c2", pass_if: "dates the attack to 1854-1855", severity: "major" },
    ],
  }],
} as unknown as PilotManifest;

function fixtureRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "review-records-"));
  const cacheDir = path.join(root, PILOT_RUNS_RELATIVE_ROOT, "run-x", "cache", "B", "kierkegaard");
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(path.join(cacheDir, "kg-05-r1.json"), JSON.stringify({
    record_id: "kg-05:B:r1",
    philosopher: "kierkegaard",
    result: {
      condition: "B",
      question_id: "kg-05",
      question_as_asked: "What was your attack on the Danish State Church?",
      reply: "I attacked a bishop eulogized as a witness to the truth.",
      retrieved_sources: [{ id: "quote:kierkegaard:x" }],
      blind_judge: {
        checks: [
          { id: "kg-05-c1", verdict: "pass", evidence_span: "a bishop eulogized", why: "mentions the bishop" },
          { id: "kg-05-c2", verdict: "fail", evidence_span: null, why: "no date given" },
        ],
      },
    },
  }));
  return root;
}

describe("review record assembly", () => {
  it("joins cached judge verdicts to the frozen pass_if and severity", () => {
    const records = buildReviewRecords(fixtureRoot(), "run-x", MANIFEST, {});

    expect(records).toHaveLength(1);
    expect(records[0].record_id).toBe("kg-05:B:r1");
    expect(records[0].question).toContain("Danish State Church");
    expect(records[0].retrieved_source_ids).toEqual(["quote:kierkegaard:x"]);
    expect(records[0].checks[0]).toMatchObject({
      id: "kg-05-c1",
      pass_if: "names Mynster and Martensen",
      severity: "critical",
      judge_verdict: "pass",
      evidence_span: "a bishop eulogized",
      decision: null,
    });
    expect(records[0].checks[1].evidence_span).toBeNull();
  });

  it("attaches an existing decision to the right check", () => {
    const decision = {
      verdict: "disagree" as const,
      evidence: "not_probative" as const,
      reason: "The span names no one; the check asks for Mynster and Martensen.",
      decided_at: "2026-07-23T00:00:00.000Z",
    };
    const records = buildReviewRecords(fixtureRoot(), "run-x", MANIFEST, {
      "kg-05:B:r1::kg-05-c1": decision,
    });

    expect(records[0].checks[0].decision).toEqual(decision);
    expect(records[0].checks[1].decision).toBeNull();
    expect(summarizeProgress(records)).toEqual({
      checks: 2,
      decided: 1,
      disagreed: 1,
      not_probative: 1,
    });
  });

  it("returns nothing rather than throwing when a run has no cached records", () => {
    expect(buildReviewRecords(mkdtempSync(path.join(tmpdir(), "empty-")), "run-x", MANIFEST, {})).toEqual([]);
  });
});

describe("decision validation", () => {
  it("keeps the verdict and evidence questions independent", () => {
    // The whole point: a judge can quote real but non-probative text, so
    // agreeing with the verdict must not imply the evidence was any good.
    const decision = validateDecision({
      verdict: "agree",
      evidence: "not_probative",
      reason: "Right answer, but the span quoted is irrelevant to the check.",
    });
    expect(decision.verdict).toBe("agree");
    expect(decision.evidence).toBe("not_probative");
  });

  it("refuses a disputed verdict with no reason", () => {
    expect(() => validateDecision({ verdict: "disagree", evidence: "probative", reason: "  " }))
      .toThrow(/denial must record a reason/);
  });

  it("refuses a rejected evidence span with no reason", () => {
    expect(() => validateDecision({ verdict: "agree", evidence: "not_probative" }))
      .toThrow(/denial must record a reason/);
  });

  it("refuses a half-answered decision", () => {
    expect(() => validateDecision({ verdict: "agree" })).toThrow(/evidence must be/);
    expect(() => validateDecision({ evidence: "probative" })).toThrow(/verdict must be/);
  });

  it("accepts a plain approval with no reason", () => {
    expect(validateDecision({ verdict: "agree", evidence: "probative" }).reason).toBe("");
  });
});
