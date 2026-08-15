import { readFileSync } from "node:fs";
import path from "node:path";
import type { PilotManifest } from "./pilot-manifest";

type Condition = "A" | "B";
type Severity = "critical" | "major" | "minor";

interface CachedRecord {
  result: {
    question_id: string;
    reply: string;
    checks: { id: string; verdict: "pass" | "fail" }[];
    retrieved_sources: { id: string }[];
    metrics: {
      retrieval_ms: number;
      first_token_ms: number;
      first_audio_ms: number;
      full_response_ms: number;
      reply_chars: number;
    };
    provider: { retries: number; outage_excluded: boolean };
  };
  b_safety: {
    mapped_eligible_ids: string[];
    retrieved_mapped_ids: string[];
    empty_support: boolean;
  };
}

const WEIGHTS: Record<Severity, number> = { critical: 5, major: 2, minor: 1 };

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

function rounded(value: number): number {
  return Number(value.toFixed(3));
}

function main() {
  const runLabel = process.argv[2];
  if (!runLabel) throw new Error("Usage: tsx scripts/summarize-pilot-ab.ts <run-label>");
  const manifest = JSON.parse(readFileSync("data/rag/eval/pilot-manifest.json", "utf8")) as PilotManifest;
  const runRoot = path.join("data", "rag", "stress", "pilot-runs", runLabel);
  const records = new Map<string, CachedRecord>();
  for (const condition of ["A", "B"] as const) {
    for (const question of manifest.questions) {
      const target = path.join(runRoot, "cache", condition, question.philosopher, `${question.id}-r1.json`);
      records.set(`${condition}:${question.id}`, JSON.parse(readFileSync(target, "utf8")) as CachedRecord);
    }
  }

  const checkMeta = new Map(manifest.questions.flatMap((question) =>
    question.checks.map((check) => [check.id, {
      severity: check.severity,
      questionId: question.id,
      philosopher: question.philosopher,
      inspiredCard: question.inspired_card,
      category: question.category,
    }] as const),
  ));

  function summarizeGroup(condition: Condition, questionIds: Set<string>) {
    const bySeverity = Object.fromEntries((["critical", "major", "minor"] as const).map((severity) =>
      [severity, { passed: 0, total: 0 }],
    )) as Record<Severity, { passed: number; total: number }>;
    let flatPassed = 0;
    let flatTotal = 0;
    let weightedPassed = 0;
    let weightedTotal = 0;
    for (const question of manifest.questions.filter((item) => questionIds.has(item.id))) {
      const record = records.get(`${condition}:${question.id}`)!;
      for (const verdict of record.result.checks) {
        const severity = checkMeta.get(verdict.id)!.severity;
        bySeverity[severity].total += 1;
        flatTotal += 1;
        weightedTotal += WEIGHTS[severity];
        if (verdict.verdict === "pass") {
          bySeverity[severity].passed += 1;
          flatPassed += 1;
          weightedPassed += WEIGHTS[severity];
        }
      }
    }
    return {
      flat: { passed: flatPassed, total: flatTotal, percent: rounded(100 * flatPassed / flatTotal) },
      weighted: { passed: weightedPassed, total: weightedTotal, percent: rounded(100 * weightedPassed / weightedTotal) },
      by_severity: bySeverity,
    };
  }

  const allIds = new Set(manifest.questions.map((question) => question.id));
  const inspiredIds = new Set(manifest.questions.filter((question) => question.inspired_card).map((question) => question.id));
  const heldOutIds = new Set(manifest.questions.filter((question) => !question.inspired_card).map((question) => question.id));
  const latencyKeys = ["retrieval_ms", "first_token_ms", "first_audio_ms", "full_response_ms", "reply_chars"] as const;

  function conditionSummary(condition: Condition) {
    const latency = Object.fromEntries(latencyKeys.map((key) => {
      const values = manifest.questions.map((question) => records.get(`${condition}:${question.id}`)!.result.metrics[key]);
      return [key, { median: rounded(percentile(values, 0.5)), p95: rounded(percentile(values, 0.95)) }];
    }));
    const byPhilosopher = Object.fromEntries(
      [...new Set(manifest.questions.map((question) => question.philosopher))].map((philosopher) => [
        philosopher,
        summarizeGroup(condition, new Set(manifest.questions.filter((question) => question.philosopher === philosopher).map((question) => question.id))),
      ]),
    );
    const sourceCounts = manifest.questions.map((question) => records.get(`${condition}:${question.id}`)!.result.retrieved_sources.length);
    return {
      overall: summarizeGroup(condition, allIds),
      inspired: summarizeGroup(condition, inspiredIds),
      held_out: summarizeGroup(condition, heldOutIds),
      by_philosopher: byPhilosopher,
      latency,
      retrieval: {
        records_with_sources: sourceCounts.filter((count) => count > 0).length,
        total_sources: sourceCounts.reduce((sum, count) => sum + count, 0),
      },
      provider: {
        retries: manifest.questions.reduce((sum, question) => sum + records.get(`${condition}:${question.id}`)!.result.provider.retries, 0),
        outage_excluded: manifest.questions.filter((question) => records.get(`${condition}:${question.id}`)!.result.provider.outage_excluded).length,
      },
    };
  }

  const flips: {
    question_id: string;
    philosopher: string;
    check_id: string;
    severity: Severity;
    from: "pass" | "fail";
    to: "pass" | "fail";
  }[] = [];
  for (const question of manifest.questions) {
    const aChecks = new Map(records.get(`A:${question.id}`)!.result.checks.map((check) => [check.id, check.verdict]));
    for (const bCheck of records.get(`B:${question.id}`)!.result.checks) {
      const from = aChecks.get(bCheck.id)!;
      if (from !== bCheck.verdict) {
        flips.push({
          question_id: question.id,
          philosopher: question.philosopher,
          check_id: bCheck.id,
          severity: checkMeta.get(bCheck.id)!.severity,
          from,
          to: bCheck.verdict,
        });
      }
    }
  }

  const a = conditionSummary("A");
  const b = conditionSummary("B");
  const latencyDelta = Object.fromEntries(latencyKeys.map((key) => [key, {
    median_delta: rounded(b.latency[key].median - a.latency[key].median),
    p95_delta: rounded(b.latency[key].p95 - a.latency[key].p95),
    p95_ratio: rounded(b.latency[key].p95 / a.latency[key].p95),
  }]));
  const bSafety = manifest.questions.map((question) => records.get(`B:${question.id}`)!.b_safety);
  const deepSourceIds = new Set(manifest.questions.filter((question) =>
    records.get(`B:${question.id}`)!.result.retrieved_sources.some((source) => !source.id.startsWith("source:")),
  ).map((question) => question.id));
  const noDeepSourceIds = new Set(manifest.questions.filter((question) => !deepSourceIds.has(question.id)).map((question) => question.id));

  console.log(JSON.stringify({
    run_label: runLabel,
    condition_A: a,
    condition_B: b,
    deltas: {
      flat_percentage_points: rounded(b.overall.flat.percent - a.overall.flat.percent),
      weighted_percentage_points: rounded(b.overall.weighted.percent - a.overall.weighted.percent),
      held_out_weighted_percentage_points: rounded(b.held_out.weighted.percent - a.held_out.weighted.percent),
      inspired_weighted_percentage_points: rounded(b.inspired.weighted.percent - a.inspired.weighted.percent),
      latency: latencyDelta,
    },
    flips,
    attribution_slice: {
      questions_with_deep_corpus: deepSourceIds.size,
      with_deep_corpus: {
        A: summarizeGroup("A", deepSourceIds),
        B: summarizeGroup("B", deepSourceIds),
      },
      without_deep_corpus: {
        A: summarizeGroup("A", noDeepSourceIds),
        B: summarizeGroup("B", noDeepSourceIds),
      },
    },
    b_safety: {
      mapped_questions: bSafety.filter((item) => item.mapped_eligible_ids.length > 0).length,
      mapped_questions_with_retrieved_support: bSafety.filter((item) => item.retrieved_mapped_ids.length > 0).length,
      empty_support_questions: bSafety.filter((item) => item.empty_support).length,
      empty_support_with_sources: manifest.questions.filter((question) => {
        const record = records.get(`B:${question.id}`)!;
        return record.b_safety.empty_support && record.result.retrieved_sources.length > 0;
      }).length,
    },
  }, null, 2));
}

main();
