/**
 * Data layer for the human-review dashboard.
 *
 * The automated blind judge is a first-pass draft, not the final word. It
 * shares a model lineage with the thing it grades, so it shares blind spots:
 * `normalizeJudgeChecks` only proves an `evidence_span` is a real substring of
 * the reply, never that the quoted span actually *supports* the `pass_if`, and
 * a check like "names the correct pseudonym" silently assumes the judge itself
 * knows the right answer. A human is the finalizing authority.
 *
 * Two separate questions are therefore recorded per check, never collapsed
 * into one approve/deny click:
 *   1. verdict   — do you agree with the judge's pass/fail?
 *   2. evidence  — is the quoted span actually probative of this check?
 * A judge can quote real but irrelevant text and pass both the code-level
 * check and a single careless click; asking separately is what catches it.
 *
 * Denial reasons are recorded for later human use — improving judge prompts or
 * corpus content. Nothing here feeds back automatically; a human decides.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { PilotResultRecord } from "./pilot-harness";
import { PILOT_RUNS_RELATIVE_ROOT } from "./pilot-harness";
import type { FrozenCheck, PilotManifest } from "./pilot-manifest";

export type VerdictDecision = "agree" | "disagree";
export type EvidenceDecision = "probative" | "not_probative" | "no_span";

export interface CheckDecision {
  verdict: VerdictDecision | null;
  evidence: EvidenceDecision | null;
  reason: string;
  decided_at: string;
}

/** Keyed `<record_id>::<check_id>`. */
export type DecisionFile = Record<string, CheckDecision>;

export interface ReviewCheck {
  id: string;
  pass_if: string;
  severity: FrozenCheck["severity"];
  judge_verdict: "pass" | "fail";
  judge_why: string;
  evidence_span: string | null;
  decision: CheckDecision | null;
}

export interface ReviewRecord {
  record_id: string;
  question_id: string;
  condition: string;
  philosopher: string;
  question: string;
  reply: string;
  retrieved_source_ids: string[];
  checks: ReviewCheck[];
}

interface CachedShape {
  record_id: string;
  philosopher: string;
  result: PilotResultRecord;
}

export function decisionKey(recordId: string, checkId: string): string {
  return `${recordId}::${checkId}`;
}

export function decisionsPath(projectRoot: string, runLabel: string): string {
  return path.join(projectRoot, "data", "rag", "review", "decisions", `${runLabel}.json`);
}

export function loadDecisions(projectRoot: string, runLabel: string): DecisionFile {
  const target = decisionsPath(projectRoot, runLabel);
  return existsSync(target) ? (JSON.parse(readFileSync(target, "utf8")) as DecisionFile) : {};
}

/**
 * Reject an incomplete decision rather than storing a half-answer: a denial
 * without a reason is exactly the information this dashboard exists to capture.
 */
export function validateDecision(input: Partial<CheckDecision>): CheckDecision {
  const verdict = input.verdict ?? null;
  const evidence = input.evidence ?? null;
  const reason = (input.reason ?? "").trim();

  if (verdict !== "agree" && verdict !== "disagree") {
    throw new Error("verdict must be 'agree' or 'disagree'");
  }
  if (evidence !== "probative" && evidence !== "not_probative" && evidence !== "no_span") {
    throw new Error("evidence must be 'probative', 'not_probative', or 'no_span'");
  }
  if ((verdict === "disagree" || evidence === "not_probative") && !reason) {
    throw new Error("a denial must record a reason");
  }
  return { verdict, evidence, reason, decided_at: new Date().toISOString() };
}

function readCachedRecords(runRoot: string): CachedShape[] {
  const cacheRoot = path.join(runRoot, "cache");
  if (!existsSync(cacheRoot)) return [];
  const records: CachedShape[] = [];
  for (const condition of readdirSync(cacheRoot)) {
    const conditionRoot = path.join(cacheRoot, condition);
    for (const philosopher of readdirSync(conditionRoot)) {
      const philosopherRoot = path.join(conditionRoot, philosopher);
      for (const file of readdirSync(philosopherRoot).filter((name) => name.endsWith(".json"))) {
        records.push(
          JSON.parse(readFileSync(path.join(philosopherRoot, file), "utf8")) as CachedShape,
        );
      }
    }
  }
  return records;
}

/**
 * Join cached pilot records to the frozen manifest (for `pass_if` and
 * severity, which the cache does not carry) and to any existing decisions.
 */
export function buildReviewRecords(
  projectRoot: string,
  runLabel: string,
  manifest: PilotManifest,
  decisions: DecisionFile = loadDecisions(projectRoot, runLabel),
): ReviewRecord[] {
  const runRoot = path.resolve(projectRoot, PILOT_RUNS_RELATIVE_ROOT, runLabel);
  const frozenByQuestion = new Map(
    manifest.questions.map((question) => [
      question.id,
      new Map(question.checks.map((check) => [check.id, check])),
    ]),
  );

  return readCachedRecords(runRoot)
    .map((cached): ReviewRecord => {
      const result = cached.result;
      const frozen = frozenByQuestion.get(result.question_id);
      return {
        record_id: cached.record_id,
        question_id: result.question_id,
        condition: result.condition,
        philosopher: cached.philosopher,
        question: result.question_as_asked,
        reply: result.reply,
        retrieved_source_ids: result.retrieved_sources.map((source) => source.id),
        checks: result.blind_judge.checks.map((check): ReviewCheck => ({
          id: check.id,
          pass_if: frozen?.get(check.id)?.pass_if ?? "(check absent from the frozen manifest)",
          severity: frozen?.get(check.id)?.severity ?? "minor",
          judge_verdict: check.verdict,
          judge_why: check.why,
          evidence_span: check.evidence_span,
          decision: decisions[decisionKey(cached.record_id, check.id)] ?? null,
        })),
      };
    })
    .sort((left, right) => left.record_id.localeCompare(right.record_id));
}

export interface ReviewProgress {
  checks: number;
  decided: number;
  disagreed: number;
  not_probative: number;
}

export function summarizeProgress(records: ReviewRecord[]): ReviewProgress {
  const checks = records.flatMap((record) => record.checks);
  return {
    checks: checks.length,
    decided: checks.filter((check) => check.decision !== null).length,
    disagreed: checks.filter((check) => check.decision?.verdict === "disagree").length,
    not_probative: checks.filter((check) => check.decision?.evidence === "not_probative").length,
  };
}
