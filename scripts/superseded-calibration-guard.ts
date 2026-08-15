/**
 * Shared guard for the Gate 2 / Gate 3 calibration checks.
 *
 * Both gates were built entirely against the old Condition B search space:
 * 259 mixed units, 257 of them position cards. Every Gate 2 positive probe
 * expects a specific card at rank 1-3, and Gate 3 asserts per-philosopher
 * vector alignment against the full indexed corpus and a 10/10 mapped-recall
 * figure whose mappings are almost all cards.
 *
 * `RETRIEVABLE_CORPUS_TYPES` no longer includes `position_card`, so both gates
 * now fail by construction. That is the intended consequence of the narrowing,
 * not a runtime defect — but a bare AssertionError reads like a broken
 * retriever, so fail early with the actual explanation instead.
 *
 * These gates are not repaired here on purpose: repairing them *is* the
 * recalibration, and recalibration is deliberately deferred (analysis only) in
 * docs/rag_narrowed_scope_recalibration.md. Delete this guard as part of that
 * work, once the thresholds and probes have been re-derived.
 */
import { RETRIEVABLE_CORPUS_TYPES } from "../src/lib/retrieval";

export function assertCalibrationScopeStillValid(gate: string): void {
  if (RETRIEVABLE_CORPUS_TYPES.has("position_card")) return;
  throw new Error([
    `${gate} is calibrated against a superseded corpus scope and cannot pass as written.`,
    "",
    "Retrieval no longer scores or injects position_card units, so every probe and",
    "threshold in this check refers to material the retriever can no longer see.",
    `Currently retrievable types: ${[...RETRIEVABLE_CORPUS_TYPES].join(", ")} —`,
    "which the generated index supplies as exactly two verified Nietzsche quotations",
    "and zero misattribution warnings.",
    "",
    "This is expected. Re-deriving these gates against the narrowed candidate set is",
    "scoped, unexecuted work: see docs/rag_narrowed_scope_recalibration.md.",
    "Nothing here indicates a fault in src/lib/retrieval.ts; `npm test` covers that.",
  ].join("\n"));
}
