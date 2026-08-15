import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ExperimentCondition } from "../src/lib/experiment-conditions";
import type { FrozenCheck, FrozenQuestion, PilotManifest } from "./pilot-manifest";

export const PILOT_RUNS_RELATIVE_ROOT = path.join("data", "rag", "stress", "pilot-runs");

export interface PilotRetrievedSource {
  id: string;
  type: "curated_excerpt" | "position_card" | "verified_quote" | "misattribution_warning";
  label: string;
  text: string;
  score: number;
  citations: string[];
}

export interface ProviderErrorRecord {
  stage: "answer" | "judge" | "tts";
  attempt: number;
  code: string | null;
  message: string;
}

export interface PilotCheckVerdict {
  id: string;
  verdict: "pass" | "fail";
  evidence_span: string | null;
  why: string;
  correction_source?: string;
}

export interface PilotResultRecord {
  condition: ExperimentCondition;
  run_label: string;
  question_id: string;
  repetition: number;
  question_as_asked: string;
  answer_level: string;
  reply: string;
  retrieved_sources: PilotRetrievedSource[];
  /** Dashboard-compatible alias for metrics.full_response_ms. */
  latency_ms: number;
  /** Dashboard-compatible alias for blind_judge.checks. */
  checks: PilotCheckVerdict[];
  metrics: {
    retrieval_ms: number;
    first_token_ms: number;
    first_audio_ms: number;
    full_response_ms: number;
    reply_chars: number;
  };
  voice: {
    first_audio_path: "web-audio" | "web-speech";
    tts_requests: 1;
  };
  provider: {
    errors: ProviderErrorRecord[];
    retries: number;
    outage_excluded: boolean;
    outage_exclusion_reason: string | null;
  };
  blind_judge: {
    status: "pending" | "complete" | "error";
    blinded_answer_id: string;
    checks: PilotCheckVerdict[];
  };
  human_audit: {
    status: "not_selected" | "pending" | "complete";
    selected_reason: string | null;
    notes: string | null;
  };
}

export interface PilotResultFile {
  schema_version: 1;
  run: {
    condition: ExperimentCondition;
    label: string;
    date: string;
    pilot_id: string;
    manifest_sha256: string;
    repetition_count: number;
    model: string;
  };
  results: PilotResultRecord[];
}

export interface PilotRunPaths {
  root: string;
  conditionRoot: string;
  cacheRoot: string;
  resultPath(philosopher: string): string;
  cachePath(philosopher: string): string;
}

function safeLabel(value: string, field: string): string {
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)) {
    throw new Error(`${field} must contain only letters, digits, dot, underscore, or hyphen`);
  }
  return value;
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function pilotRunPaths(
  projectRoot: string,
  runLabel: string,
  condition: ExperimentCondition,
): PilotRunPaths {
  safeLabel(runLabel, "run label");
  if (!(["A", "B", "C"] as string[]).includes(condition)) {
    throw new Error("condition must be A, B, or C");
  }
  const root = path.resolve(projectRoot, PILOT_RUNS_RELATIVE_ROOT, runLabel);
  const conditionRoot = path.resolve(projectRoot, "data", "rag", "stress");
  const cacheRoot = path.join(root, "cache", condition);
  return {
    root,
    conditionRoot,
    cacheRoot,
    resultPath: (philosopher) =>
      path.join(
        conditionRoot,
        safeLabel(philosopher, "philosopher"),
        `results-pilot-${runLabel}-${condition}.json`,
      ),
    cachePath: (philosopher) => path.join(cacheRoot, `${safeLabel(philosopher, "philosopher")}.json`),
  };
}

export function assertPilotWritablePath(projectRoot: string, targetPath: string): void {
  const pilotRoot = path.resolve(projectRoot, PILOT_RUNS_RELATIVE_ROOT);
  const resolved = path.resolve(targetPath);
  const relative = path.relative(path.resolve(projectRoot), resolved).replace(/\\/g, "/");
  const isDashboardCompatibleResult =
    /^data\/rag\/stress\/[a-z0-9._-]+\/results-pilot-[a-z0-9._-]+-[ABC]\.json$/i.test(relative);
  if ((!isInside(pilotRoot, resolved) || resolved === pilotRoot) && !isDashboardCompatibleResult) {
    throw new Error(`Refusing write outside isolated pilot root: ${resolved}`);
  }
  const normalized = resolved.replace(/\\/g, "/").toLowerCase();
  const protectedFragments = [
    "/data/rag/eval/questions.json",
    "/data/rag/stress/dashboard.html",
    "/src/data/source-embeddings.json",
  ];
  if (protectedFragments.some((fragment) => normalized.endsWith(fragment))) {
    throw new Error(`Refusing write to protected baseline/source path: ${resolved}`);
  }
}

export function writePilotResultFile(
  projectRoot: string,
  targetPath: string,
  file: PilotResultFile,
): void {
  assertPilotWritablePath(projectRoot, targetPath);
  validatePilotResultFile(file);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  try {
    // Exclusive creation makes every condition/repetition artifact immutable
    // and prevents accidental reruns from overwriting pilot evidence.
    writeFileSync(targetPath, `${JSON.stringify(file, null, 2)}\n`, { flag: "wx" });
  } catch (error) {
    throw new Error(`Refusing to overwrite existing pilot result: ${targetPath}`, { cause: error });
  }
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function validatePilotResultFile(file: PilotResultFile): void {
  if (file.schema_version !== 1) throw new Error("Unsupported pilot result schema");
  if (!(["A", "B", "C"] as string[]).includes(file.run.condition)) throw new Error("Invalid run condition");
  safeLabel(file.run.label, "run label");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(file.run.date)) throw new Error("Run date must be YYYY-MM-DD");
  for (const result of file.results) {
    if (result.condition !== file.run.condition || result.run_label !== file.run.label) {
      throw new Error(`Condition/run label mismatch on ${result.question_id}`);
    }
    if (!Number.isInteger(result.repetition) || result.repetition < 1) {
      throw new Error(`Invalid repetition on ${result.question_id}`);
    }
    const metrics = result.metrics;
    for (const [name, value] of Object.entries(metrics)) {
      if (!finiteNonNegative(value)) throw new Error(`Invalid metric ${name} on ${result.question_id}`);
    }
    if (metrics.reply_chars !== result.reply.length) {
      throw new Error(`reply_chars mismatch on ${result.question_id}`);
    }
    if (result.latency_ms !== metrics.full_response_ms) {
      throw new Error(`dashboard latency alias mismatch on ${result.question_id}`);
    }
    if (!(["web-audio", "web-speech"] as string[]).includes(result.voice.first_audio_path)) {
      throw new Error(`Invalid first-audio path on ${result.question_id}`);
    }
    if (result.voice.tts_requests !== 1) {
      throw new Error(`Pilot first-audio measurement must use exactly one TTS request on ${result.question_id}`);
    }
    if (result.provider.retries < 0 || !Number.isInteger(result.provider.retries)) {
      throw new Error(`Invalid retries on ${result.question_id}`);
    }
    for (const source of result.retrieved_sources) {
      if (
        !source.id ||
        !source.type ||
        !source.label ||
        !source.text ||
        !finiteNonNegative(source.score) ||
        !Array.isArray(source.citations)
      ) {
        throw new Error(`Invalid retrieved source on ${result.question_id}`);
      }
    }
    const frozenIds = new Set(result.blind_judge.checks.map((check) => check.id));
    if (frozenIds.size !== result.blind_judge.checks.length) {
      throw new Error(`Duplicate blind-judge check on ${result.question_id}`);
    }
    for (const check of result.blind_judge.checks) {
      if (check.evidence_span !== null && !result.reply.includes(check.evidence_span)) {
        throw new Error(`Evidence span is not verbatim on ${result.question_id}/${check.id}`);
      }
    }
    if (JSON.stringify(result.checks) !== JSON.stringify(result.blind_judge.checks)) {
      throw new Error(`dashboard check alias mismatch on ${result.question_id}`);
    }
  }
}

export function pilotCacheKey(
  runLabel: string,
  condition: ExperimentCondition,
  philosopher: string,
  questionId: string,
  repetition: number,
): string {
  return [
    safeLabel(runLabel, "run label"),
    condition,
    safeLabel(philosopher, "philosopher"),
    safeLabel(questionId, "question ID"),
    String(repetition),
  ].join("::");
}

export function loadPilotManifest(manifestPath: string): PilotManifest {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as PilotManifest;
}

export function frozenChecksFor(question: FrozenQuestion): FrozenCheck[] {
  return question.checks;
}
