import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const FROZEN_EXAM_SHA256 =
  "5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E";

export const PILOT_ID = "rag-gate3-pilot-v1";
export const PILOT_CONDITIONS = ["A", "B", "C"] as const;

export interface FrozenCheck {
  id: string;
  pass_if: string;
  severity: "critical" | "major" | "minor";
}

export interface FrozenQuestion {
  id: string;
  philosopher: string;
  question: string;
  category: string;
  provenance: string;
  answer_level: string;
  answer_key: string;
  source: string;
  checks: FrozenCheck[];
  relevant_corpus: string[];
  inspired_card: boolean;
  failed_on: string | null;
}

interface BaselineCheck {
  id: string;
  verdict: "pass" | "fail";
}

interface BaselineResult {
  question_id: string;
  checks: BaselineCheck[];
}

interface BaselineFile {
  run: { condition: string; date: string; model: string };
  results: BaselineResult[];
}

export interface PilotQuestionRationale {
  question_id: string;
  reasons: string[];
  baseline_failed_checks: { id: string; severity: FrozenCheck["severity"] }[];
}

export interface PilotManifest {
  manifest_version: 1;
  pilot_id: string;
  frozen_exam: { path: string; sha256: string; question_count: number };
  conditions: typeof PILOT_CONDITIONS;
  repetitions_per_condition: 1;
  questions: FrozenQuestion[];
  selection_rationale: PilotQuestionRationale[];
  summary: {
    selected_questions: number;
    category_counts: Record<string, number>;
    philosopher_counts: Record<string, number>;
    provenance_counts: Record<string, number>;
    answer_level_counts: Record<string, number>;
    check_severity_counts: Record<FrozenCheck["severity"], number>;
    baseline_failed_checks: { critical: number; major: number };
    baseline_failure_questions: { critical: number; major: number; union: number };
    inspired_card: { true: number; false: number };
    relevant_corpus_empty: number;
    representative_question_ids: Record<string, string[]>;
    requirements: Record<string, boolean>;
    selection_sha256: string;
  };
  projected_usage: {
    formula: string;
    answer_calls: number;
    blind_judge_calls: number;
    first_audio_measurements: number;
    tts_requests: number;
    human_audit_base_sample: number;
    human_audit_rate: number;
    human_audit_sample: {
      selection_rule: string;
      record_ids: string[];
    };
    total_external_calls: number;
  };
}

const PASS_PLUS: Record<string, string> = {
  "kg-15": "resists the later phrase 'leap of faith' despite contaminated persona wording",
  "kg-30": "correctly calls Works of Love 'deliberations' despite the works-index mislabel",
  "cam-35": "describes The Stranger's ending more precisely than the encyclopedia summary",
};

// Add the first nine sorted frozen empty-support questions not already selected.
// cam-30 is already selected as a baseline major failure, making ten total.
const ADDITIONAL_EMPTY_SUPPORT_IDS = [
  "aq-17",
  "aq-18",
  "aq-33",
  "aq-36",
  "kg-04",
  "kg-10",
  "kg-33",
  "kg-35",
  "sartre-q07",
] as const;

const REQUIRED_REPRESENTATIVES: Record<string, string> = {
  attribution: "trap-attribution",
  locate: "locate",
  depth: "depth",
  misreading: "misreading",
};

function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex").toUpperCase();
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function loadBaselineResults(projectRoot: string): BaselineResult[] {
  const stressRoot = path.join(projectRoot, "data", "rag", "stress");
  const philosophers = ["aquinas", "nietzsche", "kierkegaard", "sartre", "camus"];
  return philosophers.flatMap((philosopher) => {
    const parsed = JSON.parse(
      readFileSync(path.join(stressRoot, philosopher, "results.json"), "utf8"),
    ) as BaselineFile;
    if (parsed.run.condition !== "baseline") {
      throw new Error(`${philosopher}/results.json is not the immutable baseline run`);
    }
    return parsed.results;
  });
}

export function buildPilotManifest(projectRoot: string): PilotManifest {
  const examPath = path.join(projectRoot, "data", "rag", "eval", "questions.json");
  const examBytes = readFileSync(examPath);
  const actualHash = sha256(examBytes);
  if (actualHash !== FROZEN_EXAM_SHA256) {
    throw new Error(`Frozen exam hash mismatch: expected ${FROZEN_EXAM_SHA256}, got ${actualHash}`);
  }

  const parsed = JSON.parse(examBytes.toString("utf8")) as { questions: FrozenQuestion[] };
  const questions = parsed.questions;
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const failuresByQuestion = new Map<string, { id: string; severity: FrozenCheck["severity"] }[]>();

  for (const result of loadBaselineResults(projectRoot)) {
    const question = questionById.get(result.question_id);
    if (!question) throw new Error(`Baseline result ${result.question_id} is absent from the frozen exam`);
    const checkById = new Map(question.checks.map((check) => [check.id, check]));
    for (const verdict of result.checks) {
      const check = checkById.get(verdict.id);
      if (!check) throw new Error(`Unknown check ${verdict.id} on ${question.id}`);
      if (verdict.verdict === "fail" && (check.severity === "critical" || check.severity === "major")) {
        const failures = failuresByQuestion.get(question.id) ?? [];
        failures.push({ id: check.id, severity: check.severity });
        failuresByQuestion.set(question.id, failures);
      }
    }
  }

  const selectedIds = new Set<string>([
    ...failuresByQuestion.keys(),
    ...Object.keys(PASS_PLUS),
    ...ADDITIONAL_EMPTY_SUPPORT_IDS,
  ]);
  const selected = questions.filter((question) => selectedIds.has(question.id));
  if (selected.length !== selectedIds.size) {
    const missing = [...selectedIds].filter((id) => !questionById.has(id));
    throw new Error(`Pilot selection contains missing frozen IDs: ${missing.join(", ")}`);
  }

  const representativeQuestionIds: Record<string, string[]> = {};
  for (const [label, category] of Object.entries(REQUIRED_REPRESENTATIVES)) {
    representativeQuestionIds[label] = selected
      .filter((question) => question.category === category)
      .map((question) => question.id);
  }
  representativeQuestionIds.pass_plus = Object.keys(PASS_PLUS);

  const selectionRationale = selected.map((question): PilotQuestionRationale => {
    const failedChecks = failuresByQuestion.get(question.id) ?? [];
    const reasons: string[] = [];
    if (failedChecks.some((check) => check.severity === "critical")) {
      reasons.push("baseline_critical_failure");
    }
    if (failedChecks.some((check) => check.severity === "major")) {
      reasons.push("baseline_major_failure");
    }
    for (const [label, category] of Object.entries(REQUIRED_REPRESENTATIVES)) {
      if (question.category === category) reasons.push(`representative_${label}`);
    }
    if (PASS_PLUS[question.id]) reasons.push(`pass_plus: ${PASS_PLUS[question.id]}`);
    if (question.relevant_corpus.length === 0) reasons.push("empty_support_over_injection_sentinel");
    if (question.inspired_card) reasons.push("inspired_card");
    else reasons.push("held_out");
    return { question_id: question.id, reasons, baseline_failed_checks: failedChecks };
  });

  const categoryCounts: Record<string, number> = {};
  const philosopherCounts: Record<string, number> = {};
  const provenanceCounts: Record<string, number> = {};
  const answerLevelCounts: Record<string, number> = {};
  const checkSeverityCounts: Record<FrozenCheck["severity"], number> = {
    critical: 0,
    major: 0,
    minor: 0,
  };
  for (const question of selected) {
    increment(categoryCounts, question.category);
    increment(philosopherCounts, question.philosopher);
    increment(provenanceCounts, question.provenance);
    increment(answerLevelCounts, question.answer_level);
    for (const check of question.checks) checkSeverityCounts[check.severity]++;
  }

  const criticalFailureQuestions = [...failuresByQuestion.entries()]
    .filter(([, checks]) => checks.some((check) => check.severity === "critical"))
    .map(([id]) => id);
  const majorFailureQuestions = [...failuresByQuestion.entries()]
    .filter(([, checks]) => checks.some((check) => check.severity === "major"))
    .map(([id]) => id);
  const failedChecks = [...failuresByQuestion.values()].flat();
  const emptySupport = selected.filter((question) => question.relevant_corpus.length === 0).length;
  const inspired = selected.filter((question) => question.inspired_card).length;
  const selectedQuestionIds = new Set(selected.map((question) => question.id));
  const allIncluded = (ids: string[]) => ids.every((id) => selectedQuestionIds.has(id));
  const requirements = {
    every_baseline_critical_failure: allIncluded(criticalFailureQuestions),
    every_baseline_major_failure: allIncluded(majorFailureQuestions),
    representative_attribution: representativeQuestionIds.attribution.length > 0,
    representative_locate: representativeQuestionIds.locate.length > 0,
    representative_depth: representativeQuestionIds.depth.length > 0,
    representative_misreading: representativeQuestionIds.misreading.length > 0,
    representative_pass_plus: representativeQuestionIds.pass_plus.every((id) => selectedQuestionIds.has(id)),
    inspired_card_present: inspired > 0,
    held_out_present: inspired < selected.length,
    at_least_ten_empty_support: emptySupport >= 10,
  };

  const n = selected.length;
  const answerCalls = n * PILOT_CONDITIONS.length;
  const judgeCalls = answerCalls;
  const firstAudioMeasurements = answerCalls;
  const humanAuditRate = 0.15;
  const humanAuditSize = Math.ceil(judgeCalls * humanAuditRate);
  const answerRecordIds = selected.flatMap((question) =>
    PILOT_CONDITIONS.map((condition) => `${question.id}:${condition}:r1`),
  );
  const criticalRecordIds = criticalFailureQuestions.flatMap((questionId) =>
    PILOT_CONDITIONS.map((condition) => `${questionId}:${condition}:r1`),
  );
  const criticalRecordSet = new Set(criticalRecordIds);
  const deterministicRemainder = answerRecordIds
    .filter((recordId) => !criticalRecordSet.has(recordId))
    .sort((left, right) => sha256(`${PILOT_ID}:${left}`).localeCompare(sha256(`${PILOT_ID}:${right}`)));
  const humanAuditRecordIds = [
    ...criticalRecordIds,
    ...deterministicRemainder.slice(0, humanAuditSize - criticalRecordIds.length),
  ];

  return {
    manifest_version: 1,
    pilot_id: PILOT_ID,
    frozen_exam: {
      path: "data/rag/eval/questions.json",
      sha256: FROZEN_EXAM_SHA256,
      question_count: questions.length,
    },
    conditions: PILOT_CONDITIONS,
    repetitions_per_condition: 1,
    questions: selected,
    selection_rationale: selectionRationale,
    summary: {
      selected_questions: n,
      category_counts: categoryCounts,
      philosopher_counts: philosopherCounts,
      provenance_counts: provenanceCounts,
      answer_level_counts: answerLevelCounts,
      check_severity_counts: checkSeverityCounts,
      baseline_failed_checks: {
        critical: failedChecks.filter((check) => check.severity === "critical").length,
        major: failedChecks.filter((check) => check.severity === "major").length,
      },
      baseline_failure_questions: {
        critical: criticalFailureQuestions.length,
        major: majorFailureQuestions.length,
        union: failuresByQuestion.size,
      },
      inspired_card: { true: inspired, false: n - inspired },
      relevant_corpus_empty: emptySupport,
      representative_question_ids: representativeQuestionIds,
      requirements,
      selection_sha256: sha256(JSON.stringify(selected)),
    },
    projected_usage: {
      formula: `N=${n}; answers=N*3; judges=N*3; first-audio=N*3; external total=N*9`,
      answer_calls: answerCalls,
      blind_judge_calls: judgeCalls,
      first_audio_measurements: firstAudioMeasurements,
      tts_requests: firstAudioMeasurements,
      human_audit_base_sample: humanAuditSize,
      human_audit_rate: humanAuditRate,
      human_audit_sample: {
        selection_rule: "all critical-failure question records, then lowest SHA-256(pilot_id:record_id) until the fixed 15% sample is full",
        record_ids: humanAuditRecordIds,
      },
      total_external_calls: answerCalls + judgeCalls + firstAudioMeasurements,
    },
  };
}
