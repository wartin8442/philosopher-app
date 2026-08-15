import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildPilotManifest, FROZEN_EXAM_SHA256 } from "./pilot-manifest";
import {
  assertPilotWritablePath,
  pilotCacheKey,
  pilotRunPaths,
  type PilotResultFile,
  validatePilotResultFile,
  writePilotResultFile,
} from "./pilot-harness";

const projectRoot = path.join(__dirname, "..");
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function resultFile(condition: "A" | "B" | "C", label = "mock-run"): PilotResultFile {
  const reply = "Exact evidence appears here.";
  return {
    schema_version: 1,
    run: {
      condition,
      label,
      date: "2026-07-19",
      pilot_id: "rag-gate3-pilot-v1",
      manifest_sha256: "fixture",
      repetition_count: 1,
      model: "mock-provider",
    },
    results: [
      {
        condition,
        run_label: label,
        question_id: "aq-01",
        repetition: 1,
        question_as_asked: "fixture question",
        answer_level: "primary-text",
        reply,
        retrieved_sources: [
          {
            id: "source:aquinas:1",
            type: "curated_excerpt",
            label: "fixture source",
            text: "fixture grounding text",
            score: 0.75,
            citations: ["ST I q.2 a.3"],
          },
        ],
        latency_ms: 4_000,
        checks: [
          {
            id: "aq-01-c1",
            verdict: "pass",
            evidence_span: "Exact evidence",
            why: "The frozen check is satisfied.",
          },
        ],
        metrics: {
          retrieval_ms: 7.5,
          first_token_ms: 900,
          first_audio_ms: 1_250,
          full_response_ms: 4_000,
          reply_chars: reply.length,
        },
        voice: {
          first_audio_path: "web-audio",
          tts_requests: 1,
        },
        provider: {
          errors: [],
          retries: 0,
          outage_excluded: false,
          outage_exclusion_reason: null,
        },
        blind_judge: {
          status: "complete",
          blinded_answer_id: "blind-001",
          checks: [
            {
              id: "aq-01-c1",
              verdict: "pass",
              evidence_span: "Exact evidence",
              why: "The frozen check is satisfied.",
            },
          ],
        },
        human_audit: {
          status: "pending",
          selected_reason: "deterministic 15% sample",
          notes: null,
        },
      },
    ],
  };
}

describe("frozen Gate 3 pilot manifest", () => {
  it("matches the checked-in deterministic build and preserves frozen questions exactly", () => {
    const built = buildPilotManifest(projectRoot);
    const frozen = JSON.parse(
      readFileSync(path.join(projectRoot, "data", "rag", "eval", "pilot-manifest.json"), "utf8"),
    );
    const exam = JSON.parse(
      readFileSync(path.join(projectRoot, "data", "rag", "eval", "questions.json"), "utf8"),
    ) as { questions: unknown[] };

    expect(frozen).toEqual(built);
    expect(built.frozen_exam.sha256).toBe(FROZEN_EXAM_SHA256);
    expect(built.frozen_exam.question_count).toBe(184);
    expect(built.summary.selected_questions).toBe(27);
    const examById = new Map(
      (exam.questions as { id: string }[]).map((question) => [question.id, question]),
    );
    for (const question of built.questions) expect(question).toEqual(examById.get(question.id));
  });

  it("proves every selection constraint and the exact unconsumed budget", () => {
    const manifest = buildPilotManifest(projectRoot);
    expect(Object.values(manifest.summary.requirements).every(Boolean)).toBe(true);
    expect(manifest.summary.baseline_failed_checks).toEqual({ critical: 1, major: 15 });
    expect(manifest.summary.baseline_failure_questions).toEqual({ critical: 1, major: 15, union: 15 });
    expect(manifest.summary.category_counts).toEqual({
      "known-answer": 9,
      locate: 2,
      "trap-attribution": 4,
      "trap-confusion": 1,
      depth: 8,
      misreading: 3,
    });
    expect(manifest.summary.inspired_card).toEqual({ true: 17, false: 10 });
    expect(manifest.summary.check_severity_counts).toEqual({ critical: 13, major: 45, minor: 10 });
    expect(manifest.summary.relevant_corpus_empty).toBe(10);
    expect(manifest.projected_usage).toMatchObject({
      answer_calls: 81,
      blind_judge_calls: 81,
      first_audio_measurements: 81,
      tts_requests: 81,
      human_audit_base_sample: 13,
      total_external_calls: 243,
    });
    expect(manifest.projected_usage.human_audit_sample.record_ids).toHaveLength(13);
    expect(manifest.projected_usage.human_audit_sample.record_ids).toEqual(
      expect.arrayContaining(["nz-19:A:r1", "nz-19:B:r1", "nz-19:C:r1"]),
    );
  });
});

describe("pilot output and cache isolation", () => {
  it("uses disjoint A/B/C result and cache paths and condition-scoped keys", () => {
    const a = pilotRunPaths(projectRoot, "pilot-r1", "A");
    const b = pilotRunPaths(projectRoot, "pilot-r1", "B");
    const c = pilotRunPaths(projectRoot, "pilot-r1", "C");
    expect(new Set([a.resultPath("aquinas"), b.resultPath("aquinas"), c.resultPath("aquinas")]).size).toBe(3);
    expect(a.resultPath("aquinas")).toMatch(/aquinas[\\/]results-pilot-pilot-r1-A\.json$/);
    expect(new Set([a.cachePath("aquinas"), b.cachePath("aquinas"), c.cachePath("aquinas")]).size).toBe(3);
    expect(
      new Set([
        pilotCacheKey("pilot-r1", "A", "aquinas", "aq-01", 1),
        pilotCacheKey("pilot-r1", "B", "aquinas", "aq-01", 1),
        pilotCacheKey("pilot-r1", "C", "aquinas", "aq-01", 1),
      ]).size,
    ).toBe(3);
  });

  it("cannot write baseline paths or overwrite either baseline or pilot results", () => {
    const root = mkdtempSync(path.join(tmpdir(), "rag-pilot-"));
    temporaryRoots.push(root);
    const baselinePath = path.join(root, "data", "rag", "stress", "aquinas", "results.json");
    mkdirSync(path.dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, "immutable baseline", "utf8");

    expect(() => assertPilotWritablePath(root, baselinePath)).toThrow(/outside isolated pilot root/);
    expect(() => writePilotResultFile(root, baselinePath, resultFile("A"))).toThrow();
    expect(readFileSync(baselinePath, "utf8")).toBe("immutable baseline");

    for (const condition of ["A", "B", "C"] as const) {
      const target = pilotRunPaths(root, "mock-run", condition).resultPath("aquinas");
      writePilotResultFile(root, target, resultFile(condition));
      expect(JSON.parse(readFileSync(target, "utf8")).run.condition).toBe(condition);
      expect(() => writePilotResultFile(root, target, resultFile(condition))).toThrow(/overwrite/);
    }
    expect(readFileSync(baselinePath, "utf8")).toBe("immutable baseline");
  });
});

describe("pilot metric and label schema", () => {
  it("accepts the complete metric/error/judge/audit fixture", () => {
    expect(() => validatePilotResultFile(resultFile("B"))).not.toThrow();
  });

  it("rejects condition-label mismatches, invalid metrics, and non-verbatim evidence", () => {
    const wrongLabel = resultFile("A");
    wrongLabel.results[0].condition = "B";
    expect(() => validatePilotResultFile(wrongLabel)).toThrow(/Condition\/run label mismatch/);

    const invalidMetric = resultFile("A");
    invalidMetric.results[0].metrics.first_audio_ms = Number.NaN;
    expect(() => validatePilotResultFile(invalidMetric)).toThrow(/Invalid metric first_audio_ms/);

    const invalidEvidence = resultFile("A");
    invalidEvidence.results[0].blind_judge.checks[0].evidence_span = "not in reply";
    expect(() => validatePilotResultFile(invalidEvidence)).toThrow(/not verbatim/);
  });
});
