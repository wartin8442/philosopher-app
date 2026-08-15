/**
 * Stress-test probe: sends one question to the running dev server's /api/chat
 * and prints the full reply plus measurement metadata. Used by the
 * per-philosopher stress-test agents (docs/stress_test_agents.md) so they all
 * share one HTTP implementation.
 *
 * Usage:
 *   npx tsx scripts/stress-probe.ts <philosopherId> <answerLevel> "<question>" [A|B|C]
 *
 *   philosopherId: aquinas | nietzsche | kierkegaard | sartre | camus
 *   answerLevel:   beginner | intermediate | advanced | primary-text
 *
 * Output (stdout): a single JSON object —
 *   { philosopherId, answerLevel, question, reply, retrieved_sources,
 *     latency_ms, first_chunk_ms, reply_chars }
 *
 * Side effects (view-only duplicates; results.json stays the source of truth):
 *   data/rag/stress/<philosopherId>/live.log  — question header, then reply
 *     appended chunk-by-chunk as it streams.
 *   data/rag/stress/live.log — one atomic entry per COMPLETED probe (two
 *     agents run concurrently; whole-entry appends keep the shared log
 *     readable).
 *
 * Rate limiting: the dev server allows 20 chat requests/min per client. On a
 * 429 the probe waits and retries (up to 5 times) rather than failing, so
 * agents never need their own pacing logic.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.STRESS_BASE_URL ?? "http://127.0.0.1:3000";

const PHILOSOPHERS = ["aquinas", "nietzsche", "kierkegaard", "sartre", "camus"];
const LEVELS = ["beginner", "intermediate", "advanced", "primary-text"];

interface SourceItem {
  id?: string;
  type?: string;
  label: string;
  text: string;
  score?: number;
  citations?: string[];
  provenance?: string;
  status?: string;
  sourcePath?: string;
}

function usage(): never {
  console.error(
    'Usage: npx tsx scripts/stress-probe.ts <philosopherId> <answerLevel> "<question>" [A|B|C]',
  );
  process.exit(2);
}

async function main() {
  const [philosopherId, answerLevel, question, conditionArg] = process.argv.slice(2);
  const condition = (conditionArg ?? process.env.STRESS_CONDITION ?? "A").toUpperCase();
  if (!philosopherId || !answerLevel || !question) usage();
  if (!PHILOSOPHERS.includes(philosopherId)) {
    console.error(`Unknown philosopher "${philosopherId}". Expected one of: ${PHILOSOPHERS.join(", ")}`);
    process.exit(2);
  }
  if (!LEVELS.includes(answerLevel)) {
    console.error(`Unknown answer level "${answerLevel}". Expected one of: ${LEVELS.join(", ")}`);
    process.exit(2);
  }
  if (!["A", "B", "C"].includes(condition)) {
    console.error(`Unknown condition "${condition}". Expected A, B, or C.`);
    process.exit(2);
  }

  const stressDir = path.join("data", "rag", "stress");
  const philosopherDir = path.join(stressDir, philosopherId);
  mkdirSync(philosopherDir, { recursive: true });
  const liveLog = path.join(philosopherDir, "live.log");
  const sharedLog = path.join(stressDir, "live.log");

  appendFileSync(
    liveLog,
    `\n=== [${new Date().toISOString()}] ${philosopherId} (${answerLevel}) ===\nQ: ${question}\nA: `,
  );

  const body = JSON.stringify({
    philosopherId,
    answerLevel,
    condition,
    messages: [{ role: "user", content: question }],
  });

  const maxAttempts = 5;
  let res: Response | undefined;
  let start = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    start = Date.now();
    res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.status !== 429) break;
    if (attempt === maxAttempts) {
      console.error("Rate limited after all retries; giving up.");
      process.exit(1);
    }
    const waitSec = Number(res.headers.get("retry-after")) || 15;
    appendFileSync(liveLog, `[429 — waiting ${waitSec}s]`);
    await new Promise((r) => setTimeout(r, waitSec * 1000));
  }
  if (!res) usage();
  if (!res.ok || !res.body) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  let reply = "";
  let sources: SourceItem[] = [];
  let firstChunkMs: number | null = null;
  let streamError: string | null = null;
  let retrievalMs: number | null = null;

  const decoder = new TextDecoder();
  let buffered = "";
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, nl).trim();
      buffered = buffered.slice(nl + 1);
      if (!line) continue;
      let event: { type?: string; text?: string; sources?: SourceItem[]; error?: string; retrieval_ms?: number };
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (event.type === "sources" && Array.isArray(event.sources)) {
        sources = event.sources;
        retrievalMs = typeof event.retrieval_ms === "number" ? event.retrieval_ms : null;
      } else if (event.type === "text" && typeof event.text === "string") {
        if (firstChunkMs === null) firstChunkMs = Date.now() - start;
        reply += event.text;
        appendFileSync(liveLog, event.text);
      } else if (event.type === "error") {
        streamError = event.error ?? "unknown stream error";
      }
    }
  }
  const latencyMs = Date.now() - start;
  appendFileSync(liveLog, "\n");

  if (streamError) {
    console.error(`Stream error: ${streamError}`);
    process.exit(1);
  }

  appendFileSync(
    sharedLog,
    [
      `\n──────── [${new Date().toISOString()}] ${philosopherId} (${answerLevel}) — ${latencyMs}ms ────────`,
      `Q: ${question}`,
      `A: ${reply}`,
      "",
    ].join("\n"),
  );

  console.log(
    JSON.stringify(
      {
        philosopherId,
        answerLevel,
        condition,
        question,
        reply,
        retrieved_sources: sources,
        latency_ms: latencyMs,
        first_chunk_ms: firstChunkMs,
        first_audio_ms: null,
        retrieval_ms: retrievalMs,
        reply_chars: reply.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
