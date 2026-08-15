import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { warmEmbedder } from "../src/lib/embeddings";
import { getPhilosopher } from "../src/lib/philosophers";
import { clearRetrievalCache } from "../src/lib/retrieval-cache";
import {
  CORPUS_INJECTION_MIN_SCORE,
  RETRIEVAL_MIN_SCORE,
  RETRIEVAL_TIMEOUT_MS,
  retrieveSources,
} from "../src/lib/retrieval";
import { assertCalibrationScopeStillValid } from "./superseded-calibration-guard";

interface Probe {
  philosopher: string;
  label: string;
  query: string;
  expectedId?: string;
}

const positives: Probe[] = [
  {
    philosopher: "aquinas",
    label: "unjust-law qualification",
    query: "Can every unjust human law simply be ignored, or can avoiding scandal still bind conscience?",
    expectedId: "card:aquinas:unjust-human-laws-lack-full-moral-authority",
  },
  {
    philosopher: "kierkegaard",
    label: "leap-of-faith attribution",
    query: "Did Kierkegaard actually write the exact phrase leap of faith?",
    expectedId: "card:kierkegaard:kierkegaard-did-not-write-the-phrase-leap-of-faith",
  },
  {
    philosopher: "camus",
    label: "capital-punishment history",
    query: "Was Camus opposed to capital punishment without exception throughout his life, including the 1944 purge debate?",
    expectedId: "card:camus:camus-s-sustained-opposition-to-capital-punishment-had-a-1944-exception",
  },
  {
    philosopher: "nietzsche",
    label: "eternal-recurrence dispute",
    query: "Is eternal recurrence only a settled cosmological physics thesis, or does it also have practical force?",
    expectedId: "card:nietzsche:eternal-recurrence-has-practical-force-but-its-cosmological-status-is-disputed",
  },
  {
    philosopher: "sartre",
    label: "prereflective-awareness claim",
    query: "Is consciousness completely transparent to itself, or only prereflectively self-aware?",
    expectedId: "card:sartre:conscious-experience-is-prereflectively-aware-of-itself",
  },
];

const unrelatedProbes: Probe[] = [
  {
    philosopher: "aquinas",
    label: "unrelated Aquinas query",
    query: "What is your favorite pizza topping and preferred baseball stadium?",
  },
  {
    philosopher: "nietzsche",
    label: "unrelated Nietzsche query",
    query: "How should I configure a wireless printer on a home network?",
  },
];

const frozenExam = JSON.parse(
  readFileSync("data/rag/eval/questions.json", "utf8"),
) as {
  questions: {
    id: string;
    philosopher: string;
    question: string;
    relevant_corpus: string[];
  }[];
};
const emptySupportProbes: Probe[] = frozenExam.questions
  .filter((question) => question.relevant_corpus.length === 0)
  .map((question) => ({
    philosopher: question.philosopher,
    label: `empty-support ${question.id}`,
    query: question.question,
  }));
const negatives = [...unrelatedProbes, ...emptySupportProbes];

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

async function fresh(probe: Probe, minScore?: number) {
  const philosopher = getPhilosopher(probe.philosopher);
  assert(philosopher, `Unknown philosopher ${probe.philosopher}`);
  clearRetrievalCache();
  const started = performance.now();
  const results = await retrieveSources(philosopher, probe.query, {
    condition: "B",
    maxResults: 3,
    ...(minScore === undefined ? {} : { minScore }),
  });
  return { results, elapsedMs: performance.now() - started };
}

async function main() {
  assertCalibrationScopeStillValid("Gate 2");
  const warmStarted = performance.now();
  await warmEmbedder();
  console.log(`Local model warm-up: ${(performance.now() - warmStarted).toFixed(3)}ms`);
  console.log(`A/C threshold=${RETRIEVAL_MIN_SCORE}; B threshold=${CORPUS_INJECTION_MIN_SCORE}; ` +
    `fresh budget=${RETRIEVAL_TIMEOUT_MS}ms`);

  const latencies: number[] = [];
  for (const probe of positives) {
    const { results, elapsedMs } = await fresh(probe);
    latencies.push(elapsedMs);
    const rank = results.findIndex((result) => result.id === probe.expectedId) + 1;
    console.log(`POS ${probe.label}: ${elapsedMs.toFixed(3)}ms rank=${rank} ` +
      results.map((result) => `${result.id}@${result.score.toFixed(4)}`).join(", "));
    assert(rank >= 1 && rank <= 3, `${probe.label}: expected card missing from top three`);
    assert(results.every((result) => result.philosopher === probe.philosopher),
      `${probe.label}: cross-philosopher retrieval detected`);
  }

  const negativeFailures: string[] = [];
  for (const probe of negatives) {
    const { results, elapsedMs } = await fresh(probe, Number.NEGATIVE_INFINITY);
    latencies.push(elapsedMs);
    const topScore = results[0]?.score ?? Number.NEGATIVE_INFINITY;
    console.log(`NEG ${probe.label}: ${elapsedMs.toFixed(3)}ms ` +
      `${results[0]?.id ?? "none"}@${Number.isFinite(topScore) ? topScore.toFixed(4) : "none"}`);
    const injected = await fresh(probe);
    if (topScore >= CORPUS_INJECTION_MIN_SCORE || injected.results.length > 0) {
      negativeFailures.push(`${probe.label}=${topScore.toFixed(4)}`);
    }
  }
  assert.deepEqual(negativeFailures, [],
    `negative probes crossed ${CORPUS_INJECTION_MIN_SCORE}: ${negativeFailures.join(", ")}`);

  const blank = await fresh({ philosopher: "camus", label: "blank", query: "   " });
  assert.deepEqual(blank.results, [], "blank query injected a source");

  const sartre = getPhilosopher("sartre")!;
  clearRetrievalCache();
  const conditionC = await retrieveSources(sartre, positives[4].query, {
    condition: "C",
    maxResults: 3,
    minScore: Number.NEGATIVE_INFINITY,
  });
  assert(conditionC.every((result) => result.type === "curated_excerpt"),
    "Condition C used corpus retrieval");

  clearRetrievalCache();
  await retrieveSources(sartre, positives[4].query, { condition: "B", maxResults: 3 });
  const cAfterB = await retrieveSources(sartre, positives[4].query, {
    condition: "C",
    maxResults: 3,
    minScore: Number.NEGATIVE_INFINITY,
  });
  assert(cAfterB.every((result) => result.type === "curated_excerpt"),
    "Condition B cache entry leaked into C");

  const p50 = percentile(latencies, 0.5);
  const p95 = percentile(latencies, 0.95);
  const max = Math.max(...latencies);
  console.log(`Fresh retrieval (${latencies.length} probes): p50=${p50.toFixed(3)}ms ` +
    `p95=${p95.toFixed(3)}ms max=${max.toFixed(3)}ms`);
  assert(p95 <= RETRIEVAL_TIMEOUT_MS,
    `fresh retrieval p95 ${p95.toFixed(3)}ms exceeds ${RETRIEVAL_TIMEOUT_MS}ms`);
  console.log("Gate 2 local retrieval checks: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
