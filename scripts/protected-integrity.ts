/**
 * "Has anything protected changed since it was last verified?" — in one call.
 *
 * This replaces the manual ceremony every run label change used to require
 * (recompute ~10 SHA-256 hashes by hand, paste them into the checkpoint, rerun
 * the full test suite plus gate2, gate3, preflight and browser-check, every
 * time). The safety guarantee is unchanged: frozen and immutable inputs must
 * not silently drift. Only the ritual around it is gone.
 *
 * Pure functions live here; scripts/check-protected-integrity.ts is the CLI.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const PROTECTED_BASELINE_RELATIVE_PATH = path.join(
  "data", "rag", "eval", "protected-hashes.json",
);

/**
 * Every input a pilot run must never mutate. Paths are repo-relative and
 * POSIX-separated so the baseline file is identical on Windows and CI.
 */
export const PROTECTED_PATHS: readonly string[] = [
  "data/rag/eval/questions.json",
  "data/rag/eval/pilot-manifest.json",
  "src/data/source-embeddings.json",
  "data/rag/stress/dashboard.html",
  "data/rag/stress/aquinas/results.json",
  "data/rag/stress/nietzsche/results.json",
  "data/rag/stress/kierkegaard/results.json",
  "data/rag/stress/sartre/results.json",
  "data/rag/stress/camus/results.json",
];

export interface ProtectedBaseline {
  /** When this baseline was recorded — the "last verified" in the question. */
  recorded_at: string;
  note: string;
  hashes: Record<string, string>;
}

export type ProtectedStatus = "match" | "changed" | "missing" | "unrecorded";

export interface ProtectedFinding {
  path: string;
  status: ProtectedStatus;
  expected: string | null;
  actual: string | null;
}

export interface ProtectedReport {
  ok: boolean;
  recordedAt: string;
  findings: ProtectedFinding[];
}

export function sha256File(absolutePath: string): string {
  return createHash("sha256").update(readFileSync(absolutePath)).digest("hex").toUpperCase();
}

export function hashProtectedPaths(
  projectRoot: string,
  paths: readonly string[] = PROTECTED_PATHS,
): Record<string, string | null> {
  const hashes: Record<string, string | null> = {};
  for (const relative of paths) {
    const absolute = path.join(projectRoot, ...relative.split("/"));
    hashes[relative] = existsSync(absolute) ? sha256File(absolute) : null;
  }
  return hashes;
}

/** Pure comparison seam, so drift detection is testable without real files. */
export function compareProtected(
  baseline: ProtectedBaseline,
  actual: Record<string, string | null>,
): ProtectedReport {
  const findings: ProtectedFinding[] = [];
  const seen = new Set<string>();

  for (const [relative, actualHash] of Object.entries(actual)) {
    seen.add(relative);
    const expected = baseline.hashes[relative] ?? null;
    let status: ProtectedStatus;
    if (actualHash === null) status = "missing";
    else if (expected === null) status = "unrecorded";
    else status = expected === actualHash ? "match" : "changed";
    findings.push({ path: relative, status, expected, actual: actualHash });
  }

  // A path recorded in the baseline but no longer even checked is drift too.
  for (const relative of Object.keys(baseline.hashes)) {
    if (seen.has(relative)) continue;
    findings.push({
      path: relative,
      status: "missing",
      expected: baseline.hashes[relative],
      actual: null,
    });
  }

  findings.sort((left, right) => left.path.localeCompare(right.path));
  return {
    ok: findings.every((finding) => finding.status === "match"),
    recordedAt: baseline.recorded_at,
    findings,
  };
}

export function loadProtectedBaseline(projectRoot: string): ProtectedBaseline {
  const target = path.join(projectRoot, PROTECTED_BASELINE_RELATIVE_PATH);
  if (!existsSync(target)) {
    throw new Error(
      `No protected-hash baseline at ${PROTECTED_BASELINE_RELATIVE_PATH}. ` +
        "Record one with: npm run check:integrity -- --record",
    );
  }
  return JSON.parse(readFileSync(target, "utf8")) as ProtectedBaseline;
}

export function formatReport(report: ProtectedReport): string {
  const lines = report.findings.map((finding) => {
    const mark = finding.status === "match" ? "OK    " : finding.status.toUpperCase().padEnd(6);
    const detail = finding.status === "changed"
      ? `\n         expected ${finding.expected}\n         actual   ${finding.actual}`
      : "";
    return `  ${mark} ${finding.path}${detail}`;
  });
  return [
    `Protected inputs verified against baseline recorded ${report.recordedAt}:`,
    ...lines,
    report.ok
      ? "PASS — no protected input has drifted."
      : "FAIL — protected inputs drifted. Do not spend until this is explained.",
  ].join("\n");
}
