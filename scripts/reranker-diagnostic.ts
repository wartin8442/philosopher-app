import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
} from "@xenova/transformers";
import { warmEmbedder } from "../src/lib/embeddings";
import { getPhilosopher } from "../src/lib/philosophers";
import { clearRetrievalCache } from "../src/lib/retrieval-cache";
import { retrieveSources } from "../src/lib/retrieval";
import type { PilotManifest } from "./pilot-manifest";

const MODEL = "Xenova/ms-marco-MiniLM-L-6-v2";

interface IndexedSource {
  id: string;
  type: string;
  philosopher: string;
  label: string;
}

function normalizedReference(value: string): string {
  const afterPath = value.includes("::") ? value.split("::").at(-1)! : value;
  return afterPath
    .replace(/^(card|quote|index|persona(?:-source)?|quotes\/drafts\/[^:]+)\s*:\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mappedEligibleIds(
  question: PilotManifest["questions"][number],
  allSources: IndexedSource[],
): string[] {
  const candidates = allSources.filter(
    (source) => source.philosopher === question.philosopher && source.type !== "curated_excerpt",
  );
  const matches = new Set<string>();
  for (const reference of question.relevant_corpus) {
    const expected = normalizedReference(reference);
    for (const source of candidates) {
      const label = normalizedReference(source.label);
      if (label.length >= 8 && (expected.includes(label) || label.includes(expected))) matches.add(source.id);
    }
  }
  return [...matches];
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

async function main() {
  const manifest = JSON.parse(
    readFileSync("data/rag/eval/pilot-manifest.json", "utf8"),
  ) as PilotManifest;
  const exam = JSON.parse(readFileSync("data/rag/eval/questions.json", "utf8")) as {
    questions: PilotManifest["questions"];
  };
  const index = JSON.parse(readFileSync("src/data/source-embeddings.json", "utf8")) as {
    corpusSources: Record<string, IndexedSource[]>;
  };
  const allSources = Object.values(index.corpusSources).flat();

  const loadStarted = performance.now();
  const [model, tokenizer] = await Promise.all([
    AutoModelForSequenceClassification.from_pretrained(MODEL, { quantized: true }),
    AutoTokenizer.from_pretrained(MODEL),
    warmEmbedder(),
  ]);
  console.log(`Models ready in ${(performance.now() - loadStarted).toFixed(3)}ms`);

  async function rerank(question: PilotManifest["questions"][number]) {
    const philosopher = getPhilosopher(question.philosopher)!;
    clearRetrievalCache();
    const candidates = await retrieveSources(philosopher, question.question, {
      condition: "B",
      maxResults: 5,
      minScore: Number.NEGATIVE_INFINITY,
    });
    const started = performance.now();
    const features = tokenizer(candidates.map(() => question.question), {
      text_pair: candidates.map((candidate) => `${candidate.label}. ${candidate.text}`),
      padding: true,
      truncation: true,
    });
    const output = await model(features);
    const elapsedMs = performance.now() - started;
    return {
      elapsedMs,
      results: candidates.map((candidate, index) => ({
        ...candidate,
        rerankerScore: Number(output.logits.data[index]),
      })).sort((left, right) => right.rerankerScore - left.rerankerScore),
    };
  }

  const latencies: number[] = [];
  const mappedRows: { id: string; rank: number; mappedScore: number; topScore: number }[] = [];
  for (const question of manifest.questions) {
    const mapped = mappedEligibleIds(question, allSources);
    if (mapped.length === 0) continue;
    const reranked = await rerank(question);
    latencies.push(reranked.elapsedMs);
    const rank = reranked.results.findIndex((result) => mapped.includes(result.id)) + 1;
    const mappedScore = rank > 0 ? reranked.results[rank - 1].rerankerScore : Number.NEGATIVE_INFINITY;
    const topScore = reranked.results[0]?.rerankerScore ?? Number.NEGATIVE_INFINITY;
    mappedRows.push({ id: question.id, rank, mappedScore, topScore });
    console.log(`MAP ${question.id} ${reranked.elapsedMs.toFixed(3)}ms r${rank} mapped=${mappedScore.toFixed(6)} top=${topScore.toFixed(6)} ${reranked.results.slice(0, 2).map((item) => item.id).join(",")}`);
  }

  const emptyRows: { id: string; score: number; sourceId: string }[] = [];
  for (const question of exam.questions.filter((item) => item.relevant_corpus.length === 0)) {
    const reranked = await rerank(question);
    latencies.push(reranked.elapsedMs);
    emptyRows.push({
      id: question.id,
      score: reranked.results[0]?.rerankerScore ?? Number.NEGATIVE_INFINITY,
      sourceId: reranked.results[0]?.id ?? "none",
    });
  }
  emptyRows.sort((left, right) => right.score - left.score);
  console.log(`EMPTY top five ${emptyRows.slice(0, 5).map((item) => `${item.id}:${item.sourceId}@${item.score.toFixed(6)}`).join(",")}`);
  console.log(`MAPPED minimum ${[...mappedRows].sort((left, right) => left.mappedScore - right.mappedScore)[0]?.id}@${Math.min(...mappedRows.map((item) => item.mappedScore)).toFixed(6)}`);
  console.log(`Reranker latency n=${latencies.length} p50=${percentile(latencies, 0.5).toFixed(3)}ms p95=${percentile(latencies, 0.95).toFixed(3)}ms max=${Math.max(...latencies).toFixed(3)}ms`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
