import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { createSentenceChunker } from "../src/lib/sentences";
import { getPhilosopher } from "../src/lib/philosophers";
import { getLLMProvider } from "../src/lib/providers/llm";
import type { ExperimentCondition } from "../src/lib/experiment-conditions";
import {
  assertPilotWritablePath,
  loadPilotManifest,
  pilotCacheKey,
  pilotRunPaths,
  validatePilotResultFile,
  writePilotResultFile,
  type PilotCheckVerdict,
  type PilotResultFile,
  type PilotResultRecord,
  type PilotRetrievedSource,
  type ProviderErrorRecord,
} from "./pilot-harness";
import type { FrozenCheck, FrozenQuestion, PilotManifest } from "./pilot-manifest";
import {
  ceilingViolation,
  classifyConditionBOutcome,
  type ContentAnomaly,
  type MechanismViolation,
} from "./pilot-stop-rules";
import {
  compareProtected,
  formatReport,
  hashProtectedPaths,
  loadProtectedBaseline,
} from "./protected-integrity";

const PROJECT_ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data", "rag", "eval", "pilot-manifest.json");
const INDEX_PATH = path.join(PROJECT_ROOT, "src", "data", "source-embeddings.json");
/**
 * Overridable so resuming or starting a run no longer needs a source edit.
 * Every prior stop (r3 through r10) required changing this constant and
 * redoing every completed record; a run can now be resumed under its own
 * label instead. The default stays committed so a bare invocation is still
 * fully reproducible.
 */
const RUN_LABEL = process.env.PILOT_RUN_LABEL ?? "rag-gate3-pilot-v1-r10";
const BASE_URL = (process.env.PILOT_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const STAGE_LIMITS = { answer: 108, judge: 108, tts: 108 } as const;
const TOTAL_LIMIT = 324;
const RETRY_BACKOFF_MS = [2_000, 8_000] as const;
const RUN_DATE = executionDate();

type Stage = keyof typeof STAGE_LIMITS;
type AttemptStatus = "started" | "succeeded" | "failed";

interface AttemptRecord {
  ordinal: number;
  stage: Stage;
  record_id: string;
  retry_of: number | null;
  started_at: string;
  status: AttemptStatus;
  completed_at: string | null;
  error: string | null;
}

interface UsageLedger {
  run_label: string;
  ceiling: number;
  stage_limits: typeof STAGE_LIMITS;
  attempts: AttemptRecord[];
}

interface CachedRecord {
  cache_key: string;
  record_id: string;
  philosopher: string;
  result: PilotResultRecord;
  b_safety: {
    mapped_eligible_ids: string[];
    retrieved_mapped_ids: string[];
    empty_support: boolean;
    /**
     * Set when this record is the one that tripped a mechanism violation. The
     * record is still written — it was completed and charged, and it is the
     * primary evidence for diagnosing the violation (r9 lost exactly this and
     * could not recover the reply). Exclude it from accuracy analysis.
     */
    mechanism_violation?: MechanismViolation;
  };
}

interface RawSource extends PilotRetrievedSource {
  philosopher?: string;
  sourcePath?: string;
  provenance?: string;
  status?: string;
}

interface AnswerMeasurement {
  reply: string;
  retrievedSources: PilotRetrievedSource[];
  rawSources: RawSource[];
  retrievalMs: number;
  firstTokenMs: number;
  firstAudioMs: number;
  firstAudioPath: "web-audio" | "web-speech";
  fullResponseMs: number;
  errors: ProviderErrorRecord[];
  answerRetries: number;
  ttsRetries: number;
}

interface StageOutcome<T> {
  value: T;
  retries: number;
  errors: ProviderErrorRecord[];
}

interface StoredIndexSource extends RawSource {
  hash?: string;
  vector?: number[];
}

interface AuditEntry {
  record_id: string;
  status: "complete";
  notes: string;
}

/**
 * Whether this run is currently allowed to spend. A mechanism violation sets
 * `paused` and records why; `resume` clears it after a human has actually
 * fixed the underlying path. Completed records are never touched by either.
 */
interface RunState {
  run_label: string;
  status: "open" | "paused";
  paused_at: string | null;
  paused_condition: ExperimentCondition | null;
  paused_record_id: string | null;
  violation: MechanismViolation | null;
  resolution: { resolved_at: string; note: string } | null;
}

interface AnomalyEntry extends ContentAnomaly {
  recorded_at: string;
  condition: ExperimentCondition;
  record_id: string;
  question_id: string;
}

function executionDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function loadEnvLocal(): void {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex").toUpperCase();
}

function atomicJson(target: string, value: unknown): void {
  assertPilotWritablePath(PROJECT_ROOT, target);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runRoot(): string {
  return pilotRunPaths(PROJECT_ROOT, RUN_LABEL, "A").root;
}

function usagePath(): string {
  return path.join(runRoot(), "usage.json");
}

function loadUsage(): UsageLedger {
  const target = usagePath();
  if (!existsSync(target)) {
    return { run_label: RUN_LABEL, ceiling: TOTAL_LIMIT, stage_limits: STAGE_LIMITS, attempts: [] };
  }
  return JSON.parse(readFileSync(target, "utf8")) as UsageLedger;
}

function statePath(): string {
  return path.join(runRoot(), "run-state.json");
}

function anomaliesPath(): string {
  return path.join(runRoot(), "anomalies.json");
}

function loadState(): RunState {
  const target = statePath();
  if (!existsSync(target)) {
    return {
      run_label: RUN_LABEL,
      status: "open",
      paused_at: null,
      paused_condition: null,
      paused_record_id: null,
      violation: null,
      resolution: null,
    };
  }
  return JSON.parse(readFileSync(target, "utf8")) as RunState;
}

function saveState(state: RunState): void {
  atomicJson(statePath(), state);
}

function loadAnomalies(): AnomalyEntry[] {
  const target = anomaliesPath();
  return existsSync(target) ? (JSON.parse(readFileSync(target, "utf8")) as AnomalyEntry[]) : [];
}

function appendAnomalies(entries: AnomalyEntry[]): void {
  if (entries.length === 0) return;
  atomicJson(anomaliesPath(), [...loadAnomalies(), ...entries]);
}

/**
 * Pause new spend without discarding anything. The already-cached records stay
 * exactly as written; only further answer/judge/TTS calls stop.
 */
function pauseRun(
  condition: ExperimentCondition,
  recordIdValue: string,
  violation: MechanismViolation,
): void {
  saveState({
    ...loadState(),
    run_label: RUN_LABEL,
    status: "paused",
    paused_at: new Date().toISOString(),
    paused_condition: condition,
    paused_record_id: recordIdValue,
    violation,
    resolution: null,
  });
}

/** Attempts left `started` by a killed process (r3's and r10's signature). */
function unresolvedAttempts(ledger: UsageLedger = loadUsage()): AttemptRecord[] {
  return ledger.attempts.filter((attempt) => attempt.status === "started");
}

function reserveAttempt(stage: Stage, recordId: string, retryOf: number | null = null): number {
  const ledger = loadUsage();
  const stageCount = ledger.attempts.filter((attempt) => attempt.stage === stage).length;
  if (ledger.attempts.length >= TOTAL_LIMIT) throw new Error("External-call ceiling exhausted");
  if (stageCount >= STAGE_LIMITS[stage]) throw new Error(`${stage} call ceiling exhausted`);
  const ordinal = ledger.attempts.length + 1;
  ledger.attempts.push({
    ordinal,
    stage,
    record_id: recordId,
    retry_of: retryOf,
    started_at: new Date().toISOString(),
    status: "started",
    completed_at: null,
    error: null,
  });
  atomicJson(usagePath(), ledger);
  return ordinal;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStageWithRetries<T>(
  stage: Exclude<Stage, "tts">,
  recordId: string,
  operation: (attempt: number) => Promise<T>,
): Promise<StageOutcome<T>> {
  const errors: ProviderErrorRecord[] = [];
  let retryOf: number | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (attempt > 1) await delay(RETRY_BACKOFF_MS[attempt - 2]);
    const ordinal = reserveAttempt(stage, recordId, retryOf);
    try {
      const value = await operation(attempt);
      finishAttempt(ordinal, "succeeded");
      return { value, retries: attempt - 1, errors };
    } catch (error) {
      finishAttempt(ordinal, "failed", error);
      errors.push({ stage, attempt, code: null, message: errorMessage(error) });
      retryOf = ordinal;
      if (attempt === 3) throw error;
    }
  }
  throw new Error(`Unreachable ${stage} retry state`);
}

function finishAttempt(ordinal: number, status: Exclude<AttemptStatus, "started">, error?: unknown): void {
  const ledger = loadUsage();
  const attempt = ledger.attempts.find((item) => item.ordinal === ordinal);
  if (!attempt || attempt.status !== "started") throw new Error(`Attempt ${ordinal} is not active`);
  attempt.status = status;
  attempt.completed_at = new Date().toISOString();
  attempt.error = error ? errorMessage(error) : null;
  atomicJson(usagePath(), ledger);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function recordId(question: FrozenQuestion, condition: ExperimentCondition): string {
  return `${question.id}:${condition}:r1`;
}

function cacheRecordPath(question: FrozenQuestion, condition: ExperimentCondition): string {
  const paths = pilotRunPaths(PROJECT_ROOT, RUN_LABEL, condition);
  return path.join(paths.cacheRoot, question.philosopher, `${question.id}-r1.json`);
}

function readCached(question: FrozenQuestion, condition: ExperimentCondition): CachedRecord | null {
  const target = cacheRecordPath(question, condition);
  return existsSync(target) ? (JSON.parse(readFileSync(target, "utf8")) as CachedRecord) : null;
}

function writeCached(question: FrozenQuestion, condition: ExperimentCondition, cached: CachedRecord): void {
  const target = cacheRecordPath(question, condition);
  if (existsSync(target)) throw new Error(`Refusing to overwrite pilot cache record: ${target}`);
  assertPilotWritablePath(PROJECT_ROOT, target);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(cached, null, 2)}\n`, { flag: "wx" });
}

function manifestHash(): string {
  return sha256(readFileSync(MANIFEST_PATH));
}

function opaqueAnswerId(pilotId: string, id: string): string {
  return `blind-${sha256(`${pilotId}:${id}`).slice(0, 20).toLowerCase()}`;
}

function shuffledQuestions(manifest: PilotManifest, condition: ExperimentCondition): FrozenQuestion[] {
  return [...manifest.questions].sort((left, right) =>
    sha256(`${manifest.pilot_id}:blind-order:${left.id}:${condition}:r1`).localeCompare(
      sha256(`${manifest.pilot_id}:blind-order:${right.id}:${condition}:r1`),
    ),
  );
}

async function openMeasurementBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  const audioContext = await page.evaluate(() => Boolean(window.AudioContext || window.webkitAudioContext));
  if (!audioContext) {
    await browser.close();
    throw new Error("Browser has no AudioContext; refusing synthetic first-audio timing");
  }
  return { browser, page };
}

async function browserFirstAudio(page: Page, text: string, philosopherId: string): Promise<{
  path: "web-audio" | "web-speech";
  elapsedMs: number;
}> {
  const input = JSON.stringify({ sentence: text, philosopher: philosopherId });
  return page.evaluate(`(async () => {
      const { sentence, philosopher } = ${input};
      const started = performance.now();
      let response;
      try {
        response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence, philosopherId: philosopher }),
        });
      } catch (error) {
        throw new Error("TTS network failure: " + (error instanceof Error ? error.message : String(error)));
      }
      if (response.status === 501) {
        if (!("speechSynthesis" in window)) throw new Error("TTS unavailable and Web Speech unsupported");
        return await new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(sentence);
          utterance.onstart = () => resolve({ path: "web-speech", elapsedMs: performance.now() - started });
          utterance.onerror = () => reject(new Error("Web Speech failed before onstart"));
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        });
      }
      if (!response.ok) throw new Error("TTS HTTP " + response.status + ": " + await response.text());
      const Ctor = window.AudioContext || window.webkitAudioContext;
      const context = new Ctor();
      await context.resume();
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      const scheduledAt = context.currentTime;
      source.start(scheduledAt);
      await new Promise((resolve, reject) => {
        const deadline = performance.now() + 10_000;
        const poll = () => {
          if (context.state === "running" && context.currentTime >= scheduledAt) return resolve();
          if (performance.now() >= deadline) return reject(new Error("Web Audio clock did not reach onset"));
          setTimeout(poll, 5);
        };
        poll();
      });
      const elapsedMs = performance.now() - started;
      try { source.stop(); } catch { /* already ended */ }
      await context.close();
      return { path: "web-audio", elapsedMs };
    })()`) as Promise<{ path: "web-audio" | "web-speech"; elapsedMs: number }>;
}

async function browserWebSpeech(page: Page, text: string): Promise<{
  path: "web-speech";
  elapsedMs: number;
}> {
  const input = JSON.stringify({ sentence: text });
  return page.evaluate(`(async () => {
      const { sentence } = ${input};
      const started = performance.now();
      if (!("speechSynthesis" in window)) throw new Error("Web Speech unsupported");
      return await new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.onstart = () => resolve({ path: "web-speech", elapsedMs: performance.now() - started });
        utterance.onerror = () => reject(new Error("Web Speech failed before onstart"));
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    })()`) as Promise<{ path: "web-speech"; elapsedMs: number }>;
}

function isTtsFallbackEligible(error: unknown): boolean {
  const message = errorMessage(error);
  return message.includes("TTS HTTP 502") || message.includes("TTS network failure");
}

async function measureFirstAudioWithRetries(
  page: Page,
  sentence: string,
  philosopherId: string,
  recordIdValue: string,
  recordStarted: number,
): Promise<StageOutcome<{ path: "web-audio" | "web-speech"; firstAudioMs: number }>> {
  const errors: ProviderErrorRecord[] = [];
  let retryOf: number | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (attempt > 1) await delay(RETRY_BACKOFF_MS[attempt - 2]);
    const ordinal = reserveAttempt("tts", recordIdValue, retryOf);
    try {
      const measurement = await browserFirstAudio(page, sentence, philosopherId);
      finishAttempt(ordinal, "succeeded");
      return {
        value: { path: measurement.path, firstAudioMs: performance.now() - recordStarted },
        retries: attempt - 1,
        errors,
      };
    } catch (error) {
      errors.push({ stage: "tts", attempt, code: null, message: errorMessage(error) });
      if (attempt === 3 && isTtsFallbackEligible(error)) {
        try {
          const measurement = await browserWebSpeech(page, sentence);
          finishAttempt(ordinal, "succeeded");
          return {
            value: { path: measurement.path, firstAudioMs: performance.now() - recordStarted },
            retries: attempt - 1,
            errors,
          };
        } catch (fallbackError) {
          const failure = new Error(`Web Speech fallback failed: ${errorMessage(fallbackError)}`);
          finishAttempt(ordinal, "failed", failure);
          throw failure;
        }
      }
      finishAttempt(ordinal, "failed", error);
      retryOf = ordinal;
      if (attempt === 3) throw error;
    }
  }
  throw new Error("Unreachable TTS retry state");
}

async function measureAnswerWithAudio(
  page: Page,
  question: FrozenQuestion,
  condition: ExperimentCondition,
): Promise<AnswerMeasurement> {
  const id = recordId(question, condition);
  const recordStarted = performance.now();
  const audio = {
    current: null as Promise<StageOutcome<{
      path: "web-audio" | "web-speech";
      firstAudioMs: number;
    }>> | null,
  };

  const startAudio = (sentence: string) => {
    if (audio.current) return;
    const firstAudioPromise = measureFirstAudioWithRetries(
      page,
      sentence,
      question.philosopher,
      id,
      recordStarted,
    );
    // Keep the original promise for the real await below, but attach a passive
    // rejection handler immediately so TTS cannot crash during answer streaming.
    void firstAudioPromise.catch(() => {});
    audio.current = firstAudioPromise;
  };

  let answerOutcome: StageOutcome<{
    reply: string;
    retrievedSources: PilotRetrievedSource[];
    rawSources: RawSource[];
    retrievalMs: number;
    firstTokenMs: number;
    fullResponseMs: number;
  }>;
  try {
    answerOutcome = await runStageWithRetries("answer", id, async () => {
      const started = performance.now();
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          philosopherId: question.philosopher,
          answerLevel: question.answer_level,
          condition,
          messages: [{ role: "user", content: question.question }],
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Answer HTTP ${response.status}: ${await response.text()}`);
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      const chunker = createSentenceChunker();
      let buffer = "";
      let reply = "";
      let rawSources: RawSource[] = [];
      let retrievalMs: number | null = null;
      let firstTokenMs: number | null = null;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            text?: string;
            condition?: string;
            retrieval_ms?: number;
            sources?: RawSource[];
            error?: string;
          };
          if (event.type === "sources") {
            if (event.condition !== condition) throw new Error(`Server condition mismatch: ${event.condition}`);
            rawSources = event.sources ?? [];
            retrievalMs = event.retrieval_ms ?? null;
          } else if (event.type === "text" && typeof event.text === "string") {
            if (firstTokenMs === null) firstTokenMs = performance.now() - started;
            reply += event.text;
            const sentences = chunker.push(event.text);
            if (sentences.length) startAudio(sentences[0]);
          } else if (event.type === "error") {
            throw new Error(event.error ?? "Answer stream failed");
          }
        }
      }
      if (!audio.current) {
        const tail = chunker.flush()[0];
        if (!tail) throw new Error("Answer contained no speakable text");
        startAudio(tail);
      }
      if (!reply || firstTokenMs === null || retrievalMs === null || !audio.current) {
        throw new Error("Answer stream omitted required reply/latency/audio fields");
      }
      return {
        reply,
        rawSources,
        retrievedSources: rawSources.map((source) => ({
          id: source.id,
          type: source.type,
          label: source.label,
          text: source.text,
          score: source.score,
          citations: source.citations ?? [],
        })),
        retrievalMs,
        firstTokenMs,
        fullResponseMs: performance.now() - started,
      };
    });
  } catch (error) {
    await audio.current?.catch(() => undefined);
    throw error;
  }

  if (!audio.current) throw new Error("Answer completed without a first-audio promise");
  const audioOutcome = await audio.current;
  return {
    ...answerOutcome.value,
    firstAudioMs: audioOutcome.value.firstAudioMs,
    firstAudioPath: audioOutcome.value.path,
    errors: [...answerOutcome.errors, ...audioOutcome.errors],
    answerRetries: answerOutcome.retries,
    ttsRetries: audioOutcome.retries,
  };
}

function parseJudgeJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

function normalizeJudgeChecks(
  raw: unknown,
  reply: string,
  frozenChecks: FrozenCheck[],
): PilotCheckVerdict[] {
  const values = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === "object" && Array.isArray((raw as { checks?: unknown }).checks)
      ? (raw as { checks: unknown[] }).checks
      : []);
  const byId = new Map(
    values
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => [String(item.id ?? ""), item]),
  );
  return frozenChecks.map((check) => {
    const item = byId.get(check.id);
    const requestedVerdict = item?.verdict === "pass" ? "pass" : "fail";
    const evidence = typeof item?.evidence_span === "string" ? item.evidence_span : null;
    const validEvidence = evidence !== null && evidence.length > 0 && reply.includes(evidence);
    const verdict = requestedVerdict === "pass" && validEvidence ? "pass" : "fail";
    return {
      id: check.id,
      verdict,
      evidence_span: validEvidence ? evidence : null,
      why: typeof item?.why === "string" && item.why.trim()
        ? item.why.trim()
        : verdict === "fail"
          ? "The judge supplied no valid verbatim evidence for this frozen check."
          : "The verbatim span satisfies the frozen check.",
    };
  });
}

async function blindJudge(
  manifest: PilotManifest,
  question: FrozenQuestion,
  condition: ExperimentCondition,
  reply: string,
): Promise<{
  blindedId: string;
  checks: PilotCheckVerdict[];
  retries: number;
  errors: ProviderErrorRecord[];
}> {
  const id = recordId(question, condition);
  const blindedId = opaqueAnswerId(manifest.pilot_id, id);
  const provider = getLLMProvider();
  const outcome = await runStageWithRetries("judge", id, async () => {
    const text = await provider.complete({
      system: [
        "You are a strict blind evaluator. You receive only a transcript and frozen binary checks.",
        "Evaluate each check independently. Return JSON only: {\"checks\":[{\"id\":string,\"verdict\":\"pass\"|\"fail\",\"evidence_span\":string|null,\"why\":string}]}.",
        "For a pass, evidence_span must be an exact non-empty substring copied verbatim from the assistant reply.",
        "A missing, paraphrased, or otherwise invalid evidence span fails the check. Use null for an omission.",
        "Do not infer facts absent from the transcript and do not add or remove checks.",
      ].join("\n"),
      messages: [{
        role: "user",
        content: JSON.stringify({
          answer_identity: blindedId,
          transcript: { question: question.question, assistant_reply: reply },
          checks: question.checks,
        }),
      }],
      maxTokens: 2048,
    });
    return normalizeJudgeChecks(parseJudgeJson(text), reply, question.checks);
  });
  return {
    blindedId,
    checks: outcome.value,
    retries: outcome.retries,
    errors: outcome.errors,
  };
}

function indexSources(): StoredIndexSource[] {
  const index = JSON.parse(readFileSync(INDEX_PATH, "utf8")) as {
    sources: Record<string, StoredIndexSource[]> | StoredIndexSource[];
    corpusSources: Record<string, StoredIndexSource[]> | StoredIndexSource[];
  };
  const curated = Array.isArray(index.sources) ? index.sources : Object.values(index.sources).flat();
  const corpus = Array.isArray(index.corpusSources)
    ? index.corpusSources
    : Object.values(index.corpusSources).flat();
  return [...curated, ...corpus];
}

function normalizedReference(value: string): string {
  const afterPath = value.includes("::") ? value.split("::").at(-1)! : value;
  return afterPath
    .replace(/^(card|quote|index|persona(?:-source)?|quotes\/drafts\/[^:]+)\s*:\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mappedEligibleIds(question: FrozenQuestion, allSources: StoredIndexSource[]): string[] {
  const candidates = allSources.filter(
    (source) => source.philosopher === question.philosopher && source.type !== "curated_excerpt",
  );
  const matches = new Set<string>();
  for (const reference of question.relevant_corpus) {
    const expected = normalizedReference(reference);
    if (!expected) continue;
    for (const source of candidates) {
      const label = normalizedReference(source.label);
      if (label.length >= 8 && (expected.includes(label) || label.includes(expected))) matches.add(source.id);
    }
  }
  return [...matches].sort();
}

function baselineCriticalPasses(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const philosopher of ["aquinas", "nietzsche", "kierkegaard", "sartre", "camus"]) {
    const file = JSON.parse(
      readFileSync(path.join(PROJECT_ROOT, "data", "rag", "stress", philosopher, "results.json"), "utf8"),
    ) as { results: { question_id: string; checks: { id: string; verdict: "pass" | "fail" }[] }[] };
    for (const result of file.results) {
      map.set(result.question_id, new Set(result.checks.filter((check) => check.verdict === "pass").map((check) => check.id)));
    }
  }
  return map;
}

/**
 * Evaluate one completed Condition B record against both stop-rule classes.
 *
 * This no longer throws on a bad verdict. A judge verdict failing — including
 * a new critical failure relative to the immutable baseline — is a content
 * anomaly: it is logged and the run continues, because each remaining question
 * is an independent data point. Only a mechanism violation stops spend, and
 * even then every completed record is preserved. See scripts/pilot-stop-rules.ts.
 */
function evaluateConditionB(
  question: FrozenQuestion,
  answer: AnswerMeasurement,
  checks: PilotCheckVerdict[],
  allSources: StoredIndexSource[],
  baselinePasses: Map<string, Set<string>>,
): ReturnType<typeof classifyConditionBOutcome> {
  const allowed = new Set(
    allSources
      .filter((source) => source.philosopher === question.philosopher)
      .map((source) => source.id),
  );
  const philosopher = getPhilosopher(question.philosopher);
  if (!philosopher) throw new Error(`Unknown philosopher ${question.philosopher}`);
  philosopher.sources.forEach((_source, index) => {
    allowed.add(`source:${question.philosopher}:${index + 1}`);
  });

  return classifyConditionBOutcome({
    questionId: question.id,
    philosopher: question.philosopher,
    relevantCorpus: question.relevant_corpus,
    frozenChecks: question.checks,
    retrievedSources: answer.rawSources.map((source) => ({
      id: source.id,
      philosopher: source.philosopher,
    })),
    allowedSourceIds: allowed,
    mappedEligibleIds: mappedEligibleIds(question, allSources),
    verdicts: checks.map((check) => ({ id: check.id, verdict: check.verdict })),
    baselinePassedCheckIds: baselinePasses.get(question.id) ?? new Set<string>(),
  });
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) throw new Error("Cannot calculate latency percentile with no values");
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

function assertConditionBLatencyAggregate(manifest: PilotManifest): void {
  const pairs = manifest.questions.map((question) => ({
    a: readCached(question, "A"),
    b: readCached(question, "B"),
  })).filter((pair): pair is { a: CachedRecord; b: CachedRecord } => Boolean(
    pair.a && pair.b && !pair.a.result.provider.outage_excluded && !pair.b.result.provider.outage_excluded,
  ));
  if (pairs.length !== manifest.questions.length) {
    throw new Error(`B STOP: aggregate latency requires ${manifest.questions.length} comparable pairs, found ${pairs.length}`);
  }

  const values = (condition: "a" | "b", key: keyof PilotResultRecord["metrics"]) =>
    pairs.map((pair) => pair[condition].result.metrics[key]);
  const medianDelta = (key: keyof PilotResultRecord["metrics"]) =>
    percentile(values("b", key), 0.5) - percentile(values("a", key), 0.5);
  const p95Ratio = (key: keyof PilotResultRecord["metrics"]) =>
    percentile(values("b", key), 0.95) / percentile(values("a", key), 0.95);

  const firstTokenMedianDelta = medianDelta("first_token_ms");
  const firstAudioMedianDelta = medianDelta("first_audio_ms");
  const firstTokenP95Ratio = p95Ratio("first_token_ms");
  const firstAudioP95Ratio = p95Ratio("first_audio_ms");
  const fullResponseP95Ratio = p95Ratio("full_response_ms");
  const summary =
    `median_delta_ms(first_token=${firstTokenMedianDelta.toFixed(3)},first_audio=${firstAudioMedianDelta.toFixed(3)}); ` +
    `p95_ratio(first_token=${firstTokenP95Ratio.toFixed(4)},first_audio=${firstAudioP95Ratio.toFixed(4)},full=${fullResponseP95Ratio.toFixed(4)})`;
  console.log(`B aggregate latency ${summary}`);

  const passed = !(
    firstTokenMedianDelta > 250 ||
    firstAudioMedianDelta > 250 ||
    firstTokenP95Ratio > 1.10 ||
    firstAudioP95Ratio > 1.10 ||
    fullResponseP95Ratio > 1.10
  );
  // A guardrail result is a finding, not a stop: it runs only after all 27 B
  // records are already cached, so throwing here never protected anything. It
  // is persisted and surfaced through the exit code instead.
  atomicJson(path.join(runRoot(), "latency-guardrail.json"), {
    evaluated_at: new Date().toISOString(),
    passed,
    rule: "median first-token/audio delta <= 250ms; p95 first-token/audio/full ratio <= 1.10",
    summary,
    median_delta_ms: { first_token: firstTokenMedianDelta, first_audio: firstAudioMedianDelta },
    p95_ratio: {
      first_token: firstTokenP95Ratio,
      first_audio: firstAudioP95Ratio,
      full_response: fullResponseP95Ratio,
    },
  });
  if (!passed) {
    console.error(`B FINDING: aggregate latency guardrail failed; ${summary}`);
    process.exitCode = 1;
  }
}

async function executeCondition(condition: ExperimentCondition): Promise<void> {
  const manifest = loadPilotManifest(MANIFEST_PATH);
  if (manifest.pilot_id !== "rag-gate3-pilot-v1" || manifest.repetitions_per_condition !== 1) {
    throw new Error("Frozen manifest identity/repetition mismatch");
  }

  const state = loadState();
  if (state.status === "paused") {
    throw new Error(
      `Run ${RUN_LABEL} is paused on ${state.paused_record_id} ` +
        `(${state.violation?.code}: ${state.violation?.message}). ` +
        "Fix the underlying path, then clear it with: " +
        `tsx scripts/run-pilot.ts resume "<what you fixed>"`,
    );
  }
  const stranded = unresolvedAttempts();
  if (stranded.length) {
    throw new Error(
      `${stranded.length} charged attempt(s) never resolved (ordinals ` +
        `${stranded.map((attempt) => attempt.ordinal).join(", ")}), so the ledger cannot be ` +
        "trusted. Inspect them, then run: tsx scripts/run-pilot.ts reconcile \"<explanation>\"",
    );
  }

  const allSources = indexSources();
  const baselinePasses = baselineCriticalPasses();
  const { browser, page } = await openMeasurementBrowser();
  try {
    for (const question of shuffledQuestions(manifest, condition)) {
      const id = recordId(question, condition);
      if (readCached(question, condition)) {
        console.log(`SKIP cached ${id}`);
        continue;
      }
      console.log(`START ${id}`);
      let answer: AnswerMeasurement;
      let judged: Awaited<ReturnType<typeof blindJudge>>;
      try {
        answer = await measureAnswerWithAudio(page, question, condition);
        judged = await blindJudge(manifest, question, condition, answer.reply);
      } catch (error) {
        // A ceiling is a mechanism violation: it is live for every remaining
        // record. Anything else (a third-attempt stage failure) still ends the
        // run, but every completed record survives either way.
        if (/ceiling exhausted/i.test(errorMessage(error))) {
          const violation = ceilingViolation(errorMessage(error));
          pauseRun(condition, id, violation);
          console.error(`PAUSED ${id}: ${violation.message}`);
          return;
        }
        throw error;
      }

      let safety = { mapped: [] as string[], retrievedMapped: [] as string[] };
      let violation: MechanismViolation | null = null;
      if (condition === "B") {
        const outcome = evaluateConditionB(question, answer, judged.checks, allSources, baselinePasses);
        safety = { mapped: outcome.mappedEligibleIds, retrievedMapped: outcome.retrievedMappedIds };
        violation = outcome.mechanism;
        appendAnomalies(outcome.anomalies.map((anomaly) => ({
          ...anomaly,
          recorded_at: new Date().toISOString(),
          condition,
          record_id: id,
          question_id: question.id,
        })));
        for (const anomaly of outcome.anomalies) {
          console.warn(`ANOMALY ${anomaly.code} ${anomaly.message}`);
        }
      }
      const auditSelected = manifest.projected_usage.human_audit_sample.record_ids.includes(id);
      const latencyRetries = answer.answerRetries + answer.ttsRetries;
      const totalRetries = latencyRetries + judged.retries;
      const result: PilotResultRecord = {
        condition,
        run_label: RUN_LABEL,
        question_id: question.id,
        repetition: 1,
        question_as_asked: question.question,
        answer_level: question.answer_level,
        reply: answer.reply,
        retrieved_sources: answer.retrievedSources,
        latency_ms: Number(answer.fullResponseMs.toFixed(3)),
        checks: judged.checks,
        metrics: {
          retrieval_ms: Number(answer.retrievalMs.toFixed(3)),
          first_token_ms: Number(answer.firstTokenMs.toFixed(3)),
          first_audio_ms: Number(answer.firstAudioMs.toFixed(3)),
          full_response_ms: Number(answer.fullResponseMs.toFixed(3)),
          reply_chars: answer.reply.length,
        },
        voice: { first_audio_path: answer.firstAudioPath, tts_requests: 1 },
        provider: {
          errors: [...answer.errors, ...judged.errors],
          retries: totalRetries,
          outage_excluded: latencyRetries > 0,
          outage_exclusion_reason: latencyRetries > 0
            ? "retried attempt; latency not comparable"
            : null,
        },
        blind_judge: { status: "complete", blinded_answer_id: judged.blindedId, checks: judged.checks },
        human_audit: {
          status: auditSelected ? "pending" : "not_selected",
          selected_reason: auditSelected ? "manifest deterministic 15% sample" : null,
          notes: null,
        },
      };
      const singleFile: PilotResultFile = {
        schema_version: 1,
        run: {
          condition,
          label: RUN_LABEL,
          date: RUN_DATE,
          pilot_id: manifest.pilot_id,
          manifest_sha256: manifestHash(),
          repetition_count: 1,
          model: process.env.LLM_MODEL ?? "unknown",
        },
        results: [result],
      };
      validatePilotResultFile(singleFile);
      writeCached(question, condition, {
        cache_key: pilotCacheKey(RUN_LABEL, condition, question.philosopher, question.id, 1),
        record_id: id,
        philosopher: question.philosopher,
        result,
        b_safety: {
          mapped_eligible_ids: safety.mapped,
          retrieved_mapped_ids: safety.retrievedMapped,
          empty_support: question.relevant_corpus.length === 0,
          ...(violation ? { mechanism_violation: violation } : {}),
        },
      });
      console.log(
        `DONE ${id} calls=${loadUsage().attempts.length}/${TOTAL_LIMIT} ` +
        `retrieval=${result.metrics.retrieval_ms} first_token=${result.metrics.first_token_ms} ` +
        `first_audio=${result.metrics.first_audio_ms} full=${result.metrics.full_response_ms}`,
      );

      // Cache first, pause second: the record is complete and already paid
      // for, and it is the evidence needed to diagnose the violation.
      if (violation) {
        pauseRun(condition, id, violation);
        console.error(
          `PAUSED ${id}: ${violation.code} — ${violation.message}\n` +
          `Every completed record is preserved. Fix the path, then: ` +
          `tsx scripts/run-pilot.ts resume "<what you fixed>" && ` +
          `tsx scripts/run-pilot.ts execute ${condition}`,
        );
        process.exitCode = 1;
        return;
      }
    }
    if (condition === "B") assertConditionBLatencyAggregate(manifest);
  } finally {
    await browser.close();
  }
}

function loadAllCached(manifest: PilotManifest): CachedRecord[] {
  return manifest.conditions.flatMap((condition) =>
    manifest.questions.map((question) => {
      const cached = readCached(question, condition);
      if (!cached) throw new Error(`Missing cache record ${recordId(question, condition)}`);
      return cached;
    }),
  );
}

function auditPath(): string {
  return path.join(runRoot(), "human-audit.json");
}

function finalizeOutputs(): void {
  const manifest = loadPilotManifest(MANIFEST_PATH);
  const cached = loadAllCached(manifest);
  if (!existsSync(auditPath())) throw new Error(`Missing fixed human audit: ${auditPath()}`);
  const audits = JSON.parse(readFileSync(auditPath(), "utf8")) as AuditEntry[];
  const expected = manifest.projected_usage.human_audit_sample.record_ids;
  if (audits.length !== expected.length || audits.some((audit) => !expected.includes(audit.record_id))) {
    throw new Error("Human audit IDs do not exactly match the frozen 13-record sample");
  }
  const auditById = new Map(audits.map((audit) => [audit.record_id, audit]));
  for (const item of cached) {
    const audit = auditById.get(item.record_id);
    if (audit) {
      item.result.human_audit = {
        status: "complete",
        selected_reason: "manifest deterministic 15% sample",
        notes: audit.notes,
      };
    }
  }
  for (const condition of manifest.conditions) {
    for (const philosopher of ["aquinas", "nietzsche", "kierkegaard", "sartre", "camus"]) {
      const results = manifest.questions
        .filter((question) => question.philosopher === philosopher)
        .map((question) => cached.find((item) => item.record_id === recordId(question, condition))!.result);
      const file: PilotResultFile = {
        schema_version: 1,
        run: {
          condition,
          label: RUN_LABEL,
          date: RUN_DATE,
          pilot_id: manifest.pilot_id,
          manifest_sha256: manifestHash(),
          repetition_count: 1,
          model: process.env.LLM_MODEL ?? "unknown",
        },
        results,
      };
      writePilotResultFile(PROJECT_ROOT, pilotRunPaths(PROJECT_ROOT, RUN_LABEL, condition).resultPath(philosopher), file);
    }
  }
}

function validateOutputs(): void {
  const manifest = loadPilotManifest(MANIFEST_PATH);
  let records = 0;
  for (const condition of manifest.conditions) {
    for (const philosopher of ["aquinas", "nietzsche", "kierkegaard", "sartre", "camus"]) {
      const target = pilotRunPaths(PROJECT_ROOT, RUN_LABEL, condition).resultPath(philosopher);
      const file = JSON.parse(readFileSync(target, "utf8")) as PilotResultFile;
      validatePilotResultFile(file);
      if (file.run.condition !== condition || file.run.manifest_sha256 !== manifestHash()) {
        throw new Error(`Output metadata mismatch: ${target}`);
      }
      records += file.results.length;
    }
  }
  if (records !== 81) throw new Error(`Expected 81 output records, found ${records}`);
  console.log(`Validated 15 protected output files and ${records} records.`);
}

/** Per-condition progress, so `status` answers "where would a resume start?". */
function progress(manifest: PilotManifest): Record<string, { cached: number; next: string | null }> {
  const summary: Record<string, { cached: number; next: string | null }> = {};
  for (const condition of manifest.conditions) {
    const ordered = shuffledQuestions(manifest, condition);
    const pending = ordered.filter((question) => !readCached(question, condition));
    summary[condition] = {
      cached: ordered.length - pending.length,
      next: pending[0] ? recordId(pending[0], condition) : null,
    };
  }
  return summary;
}

/**
 * Zero-spend preflight. The protected-input check is now one call instead of
 * a manual hash-by-hash ceremony, and unresolved attempts are reported rather
 * than treated as a permanent bar to resuming.
 */
function preflight(): void {
  const manifest = loadPilotManifest(MANIFEST_PATH);
  if (manifest.questions.length !== 27 || manifest.projected_usage.total_external_calls !== 243) {
    throw new Error("Frozen manifest preflight failed");
  }

  const report = compareProtected(loadProtectedBaseline(PROJECT_ROOT), hashProtectedPaths(PROJECT_ROOT));
  console.log(formatReport(report));
  if (!report.ok) process.exitCode = 1;

  const state = loadState();
  const stranded = unresolvedAttempts();
  console.log(JSON.stringify({
    runLabel: RUN_LABEL,
    manifestHash: manifestHash(),
    state,
    progress: progress(manifest),
    unresolvedAttempts: stranded,
    usage: loadUsage(),
  }, null, 2));

  if (state.status === "paused") {
    console.error(`Run is PAUSED: ${state.violation?.code} on ${state.paused_record_id}.`);
    process.exitCode = 1;
  }
  if (stranded.length) {
    console.error(`${stranded.length} charged attempt(s) unresolved; run \`reconcile\` before executing.`);
    process.exitCode = 1;
  }
}

/** Compact progress view; no spend, no protected-hash output. */
function status(): void {
  const manifest = loadPilotManifest(MANIFEST_PATH);
  const anomalies = loadAnomalies();
  console.log(JSON.stringify({
    runLabel: RUN_LABEL,
    state: loadState(),
    progress: progress(manifest),
    anomalies: {
      total: anomalies.length,
      new_critical: anomalies.filter((entry) => entry.code === "new_critical_failure").length,
    },
    unresolvedAttempts: unresolvedAttempts().map((attempt) => attempt.ordinal),
    attempts: loadUsage().attempts.length,
  }, null, 2));
}

/**
 * Clear a pause after the underlying mechanism has actually been fixed. The
 * note is required and kept: the point of pausing is that a human looked.
 */
function resume(note: string | undefined): void {
  if (!note?.trim()) throw new Error('resume requires a note: resume "<what you fixed>"');
  const state = loadState();
  if (state.status !== "paused") {
    console.log(`Run ${RUN_LABEL} is not paused; nothing to resume.`);
    return;
  }
  saveState({
    ...state,
    status: "open",
    resolution: { resolved_at: new Date().toISOString(), note: note.trim() },
  });
  console.log(
    `Resumed ${RUN_LABEL}. Cleared ${state.violation?.code} on ${state.paused_record_id}. ` +
    "Completed records are untouched; execution restarts at the next unprocessed record.",
  );
}

/**
 * Close out attempts a killed process left `started` (r3 and r10 both died
 * this way, and both runs were abandoned because the ledger could not be
 * trusted). The calls were charged and their outcome is unknown, so they are
 * marked failed with the operator's explanation rather than silently dropped.
 */
function reconcile(note: string | undefined): void {
  if (!note?.trim()) throw new Error('reconcile requires a note: reconcile "<explanation>"');
  const ledger = loadUsage();
  const stranded = unresolvedAttempts(ledger);
  if (stranded.length === 0) {
    console.log("No unresolved attempts.");
    return;
  }
  for (const attempt of stranded) {
    attempt.status = "failed";
    attempt.completed_at = new Date().toISOString();
    attempt.error = `reconciled: charged but never resolved. ${note.trim()}`;
  }
  atomicJson(usagePath(), ledger);
  console.log(
    `Reconciled ${stranded.length} charged attempt(s): ` +
    `${stranded.map((attempt) => `${attempt.ordinal}(${attempt.stage}/${attempt.record_id})`).join(", ")}. ` +
    "They remain counted against the ceiling.",
  );
}

async function browserCheck(): Promise<void> {
  const { browser, page } = await openMeasurementBrowser();
  try {
    const result = await page.evaluate(`(async () => {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      const context = new Ctor();
      await context.resume();
      const start = context.currentTime;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.02), context.sampleRate);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(start);
      await new Promise((resolve, reject) => {
        const deadline = performance.now() + 2_000;
        const poll = () => {
          if (context.state === "running" && context.currentTime >= start) return resolve();
          if (performance.now() >= deadline) return reject(new Error("Audio clock smoke check timed out"));
          setTimeout(poll, 5);
        };
        poll();
      });
      const state = context.state;
      await context.close();
      return { state, audio_clock_advanced: true };
    })()`);
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const [command, arg] = process.argv.slice(2);
  if (command === "preflight") return preflight();
  if (command === "status") return status();
  if (command === "resume") return resume(arg);
  if (command === "reconcile") return reconcile(arg);
  if (command === "browser-check") return browserCheck();
  if (command === "execute") {
    const condition = arg?.toUpperCase() as ExperimentCondition;
    if (!(manifestConditions() as string[]).includes(condition)) throw new Error("execute requires A, B, or C");
    return executeCondition(condition);
  }
  if (command === "finalize") return finalizeOutputs();
  if (command === "validate") return validateOutputs();
  throw new Error(
    "Usage: tsx scripts/run-pilot.ts " +
    "preflight|status|resume <note>|reconcile <note>|browser-check|execute <A|B|C>|finalize|validate\n" +
    "Run label comes from PILOT_RUN_LABEL (default: the committed constant).",
  );
}

function manifestConditions(): readonly ExperimentCondition[] {
  return ["A", "B", "C"];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
