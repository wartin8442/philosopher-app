/**
 * Condition B stop rules, split into the two classes the r1-r10 experience
 * showed are not the same thing.
 *
 * The old runner had one class: any violation threw, the whole run died, and
 * the next attempt needed a fresh RUN_LABEL and a full redo of every clean
 * record (r9 and r10 each re-ran 27 clean A records to reach the same seventh
 * B record). That conflated two situations with opposite correct responses:
 *
 *  - **Mechanism violation** — the retrieval/eligibility path itself is
 *    misbehaving (cross-philosopher leak, unknown source, injection on a
 *    designated empty-support question, mapped support missed, ceiling
 *    exhausted). The bad code path is still live for every subsequent record,
 *    so continuing burns spend on records that would have to be discarded.
 *    Pause new spend, keep every completed record, resume after the fix.
 *
 *  - **Content anomaly** — a judge verdict failed, including a new
 *    critical-severity failure relative to the immutable baseline. Nothing
 *    about this makes the *next* question's record suspect: each question is
 *    an independent data point. Log it and keep going. r9 proved the cost of
 *    the old behavior — it halted the entire run on `sartre-q35/q35-c2`, a
 *    check that later PASSED on a fresh isolated sample of the identical
 *    (zero-retrieval) prompt. That was sampling noise, and it cost 27 records.
 *
 * Everything here is pure so the classification can be tested without a run
 * directory, a browser, or a single external call.
 */
import type { FrozenCheck } from "./pilot-manifest";

export type MechanismCode =
  | "cross_philosopher_source"
  | "ineligible_source"
  | "empty_support_injection"
  | "mapped_support_missed"
  | "ceiling_exhausted";

export type ContentCode = "new_critical_failure" | "check_failed";

export interface MechanismViolation {
  class: "mechanism";
  code: MechanismCode;
  message: string;
}

export interface ContentAnomaly {
  class: "content";
  code: ContentCode;
  check_id: string;
  severity: FrozenCheck["severity"] | null;
  message: string;
}

export interface StopRuleInput {
  questionId: string;
  philosopher: string;
  /** [] marks a designated empty-support sentinel question. */
  relevantCorpus: string[];
  frozenChecks: FrozenCheck[];
  retrievedSources: { id: string; philosopher?: string }[];
  /** Every source ID this philosopher is allowed to retrieve. */
  allowedSourceIds: Set<string>;
  /** Manifest-mapped source IDs that still exist in the live index. */
  mappedEligibleIds: string[];
  verdicts: { id: string; verdict: "pass" | "fail" }[];
  /** Check IDs this question passed in the immutable baseline run. */
  baselinePassedCheckIds: Set<string>;
}

export interface StopRuleOutcome {
  /** Non-null means: stop spending now, but keep everything already written. */
  mechanism: MechanismViolation | null;
  /** Always recorded, never halts the run. */
  anomalies: ContentAnomaly[];
  mappedEligibleIds: string[];
  retrievedMappedIds: string[];
}

function mechanism(code: MechanismCode, message: string): MechanismViolation {
  return { class: "mechanism", code, message };
}

/**
 * Classify one completed Condition B record. Never throws: the caller decides
 * what to do with a mechanism violation, and content anomalies are data.
 */
export function classifyConditionBOutcome(input: StopRuleInput): StopRuleOutcome {
  const retrievedIds = new Set(input.retrievedSources.map((source) => source.id));
  const retrievedMappedIds = input.mappedEligibleIds.filter((id) => retrievedIds.has(id));

  const anomalies: ContentAnomaly[] = [];
  const severityById = new Map(input.frozenChecks.map((check) => [check.id, check.severity]));
  for (const verdict of input.verdicts) {
    if (verdict.verdict !== "fail") continue;
    const severity = severityById.get(verdict.id) ?? null;
    const isNewCritical =
      severity === "critical" && input.baselinePassedCheckIds.has(verdict.id);
    anomalies.push({
      class: "content",
      code: isNewCritical ? "new_critical_failure" : "check_failed",
      check_id: verdict.id,
      severity,
      message: isNewCritical
        ? `${input.questionId}/${verdict.id} passed in the immutable baseline and failed here ` +
          "(critical). Logged, not halted: a single verdict on a single sample is not a " +
          "stable signal — see the sartre-q35 flip in the r9/diagnostic record."
        : `${input.questionId}/${verdict.id} failed (${severity ?? "unknown severity"}).`,
    });
  }

  const outcome = (violation: MechanismViolation | null): StopRuleOutcome => ({
    mechanism: violation,
    anomalies,
    mappedEligibleIds: input.mappedEligibleIds,
    retrievedMappedIds,
  });

  for (const source of input.retrievedSources) {
    if (source.philosopher && source.philosopher !== input.philosopher) {
      return outcome(mechanism(
        "cross_philosopher_source",
        `cross-philosopher source ${source.id} on ${input.questionId} ` +
          `(expected ${input.philosopher}, got ${source.philosopher})`,
      ));
    }
    if (!input.allowedSourceIds.has(source.id)) {
      return outcome(mechanism(
        "ineligible_source",
        `ineligible or unknown source ${source.id} on ${input.questionId}`,
      ));
    }
  }

  if (input.relevantCorpus.length === 0 && input.retrievedSources.length > 0) {
    return outcome(mechanism(
      "empty_support_injection",
      `empty-support question ${input.questionId} retrieved ` +
        input.retrievedSources.map((source) => source.id).join(", "),
    ));
  }

  // Judgment call, documented: a mapped-support miss is not in the refactor
  // brief's mechanism list, but it is classified as one for the same reason
  // the others are. r5 stopped here and the cause was a live gating defect
  // that would have misfired on every remaining record, not a bad answer.
  if (input.mappedEligibleIds.length > 0 && retrievedMappedIds.length === 0) {
    return outcome(mechanism(
      "mapped_support_missed",
      `no mapped eligible support retrieved for ${input.questionId}; ` +
        `expected one of ${input.mappedEligibleIds.join(", ")}`,
    ));
  }

  return outcome(null);
}

/** A thrown ceiling/limit error is a mechanism violation, not a bad answer. */
export function ceilingViolation(message: string): MechanismViolation {
  return mechanism("ceiling_exhausted", message);
}
