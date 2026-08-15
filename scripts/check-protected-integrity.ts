/**
 * CLI for the protected-input integrity check.
 *
 *   npm run check:integrity              verify (exit 1 on any drift)
 *   npm run check:integrity -- --record  record/refresh the baseline
 *
 * `--record` is deliberately explicit and never implicit: silently re-recording
 * would turn the check into a rubber stamp. Refreshing an existing baseline
 * additionally requires --force, so an accidental re-record cannot erase the
 * evidence that something drifted.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  PROTECTED_BASELINE_RELATIVE_PATH,
  PROTECTED_PATHS,
  compareProtected,
  formatReport,
  hashProtectedPaths,
  loadProtectedBaseline,
  type ProtectedBaseline,
} from "./protected-integrity";

const PROJECT_ROOT = path.join(__dirname, "..");

function record(force: boolean): void {
  const target = path.join(PROJECT_ROOT, PROTECTED_BASELINE_RELATIVE_PATH);
  if (existsSync(target) && !force) {
    throw new Error(
      `${PROTECTED_BASELINE_RELATIVE_PATH} already exists. Re-recording discards the ` +
        "reference these files are checked against; pass --force only if you have " +
        "confirmed every change to a protected input was intended.",
    );
  }

  const hashes = hashProtectedPaths(PROJECT_ROOT);
  const missing = Object.entries(hashes).filter(([, hash]) => hash === null).map(([key]) => key);
  if (missing.length) throw new Error(`Refusing to record: missing protected paths ${missing.join(", ")}`);

  const baseline: ProtectedBaseline = {
    recorded_at: new Date().toISOString(),
    note:
      "SHA-256 of every input a pilot run must never mutate. Verified in one command by " +
      "`npm run check:integrity`, which replaces the per-run-label manual hash ceremony.",
    hashes: hashes as Record<string, string>,
  };
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`Recorded ${PROTECTED_PATHS.length} protected hashes to ${PROTECTED_BASELINE_RELATIVE_PATH}.`);
}

function verify(): void {
  const report = compareProtected(loadProtectedBaseline(PROJECT_ROOT), hashProtectedPaths(PROJECT_ROOT));
  console.log(formatReport(report));
  if (!report.ok) process.exitCode = 1;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--record")) return record(args.includes("--force"));
  verify();
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
