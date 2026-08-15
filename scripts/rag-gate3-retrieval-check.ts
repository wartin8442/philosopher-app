import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { dot, embedText, warmEmbedder } from "../src/lib/embeddings";
import { getPhilosopher } from "../src/lib/philosophers";
import { clearRetrievalCache } from "../src/lib/retrieval-cache";
import {
  hybridScore,
  retrieveSources,
  sourcesForCondition,
  type RetrievedSource,
} from "../src/lib/retrieval";
import type { PilotManifest } from "./pilot-manifest";
import { assertCalibrationScopeStillValid } from "./superseded-calibration-guard";

interface IndexedSource extends RetrievedSource {
  vector?: number[];
  hash?: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "being", "as", "at", "by", "it",
  "this", "that", "these", "those", "i", "you", "he", "she", "they", "we",
  "do", "does", "did", "what", "why", "how", "who", "when", "which", "your",
  "about", "would", "could", "should", "can", "will", "not", "no", "yes",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function keywordFraction(queryTokens: Set<string>, text: string): number {
  let overlap = 0;
  for (const token of tokenize(text)) if (queryTokens.has(token)) overlap += 1;
  return Math.min(1, overlap / 4);
}

function conciseText(source: Omit<RetrievedSource, "score">): string {
  return source.title && source.claim
    ? `${source.title}. ${source.claim}`
    : `${source.label}. ${source.text}`;
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
    if (!expected) continue;
    for (const source of candidates) {
      const label = normalizedReference(source.label);
      if (label.length >= 8 && (expected.includes(label) || label.includes(expected))) {
        matches.add(source.id);
      }
    }
  }
  return [...matches].sort();
}

async function main() {
  assertCalibrationScopeStillValid("Gate 3");
  const manifest = JSON.parse(
    readFileSync("data/rag/eval/pilot-manifest.json", "utf8"),
  ) as PilotManifest;
  const index = JSON.parse(
    readFileSync("src/data/source-embeddings.json", "utf8"),
  ) as {
    sources: Record<string, IndexedSource[]>;
    corpusSources: Record<string, IndexedSource[]>;
  };
  const allSources = [...Object.values(index.sources).flat(), ...Object.values(index.corpusSources).flat()];

  const warmedAt = performance.now();
  await warmEmbedder();
  console.log(`Local model warm-up: ${(performance.now() - warmedAt).toFixed(3)}ms`);

  const fieldIndexes = new Map<string, {
    source: Omit<RetrievedSource, "score">;
    full: number[];
    fields: { text: string; vector: number[] }[];
  }[]>();
  const bm25Stats = new Map<string, { averageLength: number; documentFrequency: Map<string, number> }>();
  for (const philosopherId of ["aquinas", "nietzsche", "kierkegaard", "sartre", "camus"]) {
    const philosopher = getPhilosopher(philosopherId)!;
    const sources = sourcesForCondition(philosopher, "B");
    const vectors = [...index.sources[philosopherId], ...index.corpusSources[philosopherId]];
    assert.equal(sources.length, vectors.length, `${philosopherId} vector alignment`);
    const fields = [];
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      fields.push({
        source,
        full: vectors[i].vector!,
        // Keep this diagnostic fast: the earlier exhaustive field-vector pass
        // showed that field splitting did not separate the mapped misses from
        // empty-support negatives. The production candidate below is BM25
        // reranking over the already-indexed source text.
        fields: [],
      });
    }
    fieldIndexes.set(philosopherId, fields);
    const tokenSets = fields.map(({ source }) => new Set(tokenize(`${source.label} ${source.text}`)));
    const documentFrequency = new Map<string, number>();
    for (const tokens of tokenSets) {
      for (const token of tokens) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
    bm25Stats.set(philosopherId, {
      averageLength: fields.reduce((sum, { source }) => sum + tokenize(`${source.label} ${source.text}`).length, 0) / fields.length,
      documentFrequency,
    });
  }

  function bm25(philosopherId: string, query: string, source: Omit<RetrievedSource, "score">): number {
    const fields = fieldIndexes.get(philosopherId)!;
    const { averageLength, documentFrequency } = bm25Stats.get(philosopherId)!;
    const tokens = tokenize(`${source.label} ${source.text}`);
    const frequencies = new Map<string, number>();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    const k1 = 1.2;
    const b = 0.75;
    let score = 0;
    for (const token of new Set(tokenize(query))) {
      const frequency = frequencies.get(token) ?? 0;
      if (frequency === 0) continue;
      const df = documentFrequency.get(token) ?? 0;
      const idf = Math.log(1 + (fields.length - df + 0.5) / (df + 0.5));
      score += idf * (frequency * (k1 + 1)) /
        (frequency + k1 * (1 - b + b * tokens.length / averageLength));
    }
    return score;
  }

  async function fieldAware(philosopherId: string, query: string) {
    const queryVector = await embedText(query);
    const queryTokens = new Set(tokenize(query));
    return fieldIndexes.get(philosopherId)!.map(({ source, full, fields }) => {
      const fullText = `${source.label} ${source.text}`;
      const score = Math.max(
        hybridScore(dot(queryVector, full), keywordFraction(queryTokens, fullText)),
        ...fields.map(({ text, vector }) =>
          hybridScore(dot(queryVector, vector), keywordFraction(queryTokens, text))),
      );
      return { ...source, score };
    }).sort((left, right) => right.score - left.score);
  }

  function lexical(philosopherId: string, query: string) {
    return fieldIndexes.get(philosopherId)!.map(({ source }) => ({
      ...source,
      score: bm25(philosopherId, query, source),
    })).sort((left, right) => right.score - left.score);
  }

  let mappedQuestions = 0;
  let injectedMappedQuestions = 0;
  const fieldMapped: {
    id: string;
    expectedScore: number;
    topScore: number;
    rank: number;
    lexicalScore: number;
    lexicalTop: number;
    lexicalRank: number;
  }[] = [];
  for (const question of manifest.questions) {
    const philosopher = getPhilosopher(question.philosopher);
    assert(philosopher, `Unknown philosopher ${question.philosopher}`);
    clearRetrievalCache();
    const results = await retrieveSources(philosopher, question.question, {
      condition: "B",
      maxResults: 5,
      minScore: Number.NEGATIVE_INFINITY,
    });
    const mapped = mappedEligibleIds(question, allSources);
    if (mapped.length === 0) continue;
    mappedQuestions += 1;
    const mappedRanks = mapped
      .map((id) => ({ id, rank: results.findIndex((result) => result.id === id) + 1 }))
      .filter(({ rank }) => rank > 0);
    clearRetrievalCache();
    const injected = await retrieveSources(philosopher, question.question, {
      condition: "B",
      maxResults: 2,
    });
    const injectedMapped = injected.some((result) => mapped.includes(result.id));
    if (injectedMapped) injectedMappedQuestions += 1;
    const fieldResults = await fieldAware(question.philosopher, question.question);
    const fieldRank = fieldResults.findIndex((result) => mapped.includes(result.id)) + 1;
    const lexicalResults = lexical(question.philosopher, question.question);
    const lexicalRank = lexicalResults.findIndex((result) => mapped.includes(result.id)) + 1;
    fieldMapped.push({
      id: question.id,
      expectedScore: fieldRank > 0 ? fieldResults[fieldRank - 1].score : Number.NEGATIVE_INFINITY,
      topScore: fieldResults[0]?.score ?? Number.NEGATIVE_INFINITY,
      rank: fieldRank,
      lexicalScore: lexicalRank > 0 ? lexicalResults[lexicalRank - 1].score : 0,
      lexicalTop: lexicalResults[0]?.score ?? 0,
      lexicalRank,
    });
    console.log(
      `${injectedMapped ? "PASS" : "MISS"} ${question.id} mapped=${mappedRanks.map(({ id, rank }) => `${id}@r${rank}`).join(",") || "outside-top5"} ` +
      `top=${results.slice(0, 3).map((result) => `${result.id}@${result.score.toFixed(6)}`).join(",")} ` +
      `fieldMapped=r${fieldRank}@${fieldRank > 0 ? fieldResults[fieldRank - 1].score.toFixed(6) : "none"} fieldTop=${fieldResults[0]?.score.toFixed(6)} ` +
      `bm25Mapped=r${lexicalRank}@${lexicalRank > 0 ? lexicalResults[lexicalRank - 1].score.toFixed(3) : "none"} bm25Top=${lexicalResults[0]?.score.toFixed(3)}`,
    );
  }
  console.log(`Mapped pilot recall: ${injectedMappedQuestions}/${mappedQuestions}`);
  assert.equal(mappedQuestions, 10, "Unexpected mapped pilot question count");
  assert.equal(injectedMappedQuestions, mappedQuestions, "Condition B missed mapped pilot support");

  const exam = JSON.parse(readFileSync("data/rag/eval/questions.json", "utf8")) as {
    questions: PilotManifest["questions"];
  };
  const emptyScores: {
    id: string;
    score: number;
    semanticMargin: number;
    semanticId: string;
    semanticIdLexicalRank: number;
    lexicalScore: number;
    lexicalId: string;
  }[] = [];
  const emptyInjections: string[] = [];
  for (const question of exam.questions.filter((item) => item.relevant_corpus.length === 0)) {
    const results = await fieldAware(question.philosopher, question.question);
    const lexicalResults = lexical(question.philosopher, question.question);
    const philosopher = getPhilosopher(question.philosopher)!;
    clearRetrievalCache();
    const injected = await retrieveSources(philosopher, question.question, {
      condition: "B",
      maxResults: 2,
    });
    if (injected.length > 0) emptyInjections.push(question.id);
    emptyScores.push({
      id: question.id,
      score: results[0]?.score ?? Number.NEGATIVE_INFINITY,
      semanticMargin: (results[0]?.score ?? 0) - (results[1]?.score ?? 0),
      semanticId: results[0]?.id ?? "none",
      semanticIdLexicalRank: lexicalResults.findIndex((item) => item.id === results[0]?.id) + 1,
      lexicalScore: lexicalResults[0]?.score ?? 0,
      lexicalId: lexicalResults[0]?.id ?? "none",
    });
  }
  emptyScores.sort((left, right) => right.score - left.score);
  console.log(`Field-aware empty-support maximum: ${emptyScores[0].id}@${emptyScores[0].score.toFixed(6)}`);
  console.log(`Field-aware empty-support top five: ${emptyScores.slice(0, 5).map(({ id, score, semanticMargin, semanticId, semanticIdLexicalRank }) => `${id}:${semanticId}@${score.toFixed(6)}:margin=${semanticMargin.toFixed(6)}:bm25-r${semanticIdLexicalRank}`).join(",")}`);
  const lexicalEmpty = [...emptyScores].sort((left, right) => right.lexicalScore - left.lexicalScore);
  const marginEmpty = [...emptyScores].sort((left, right) => right.semanticMargin - left.semanticMargin);
  console.log(`BM25 empty-support top five: ${lexicalEmpty.slice(0, 5).map(({ id, lexicalScore, lexicalId }) => `${id}:${lexicalId}@${lexicalScore.toFixed(3)}`).join(",")}`);
  console.log(`Semantic-margin empty-support top five: ${marginEmpty.slice(0, 5).map(({ id, semanticMargin, score, semanticId }) => `${id}:${semanticId}:margin=${semanticMargin.toFixed(6)}:top=${score.toFixed(6)}`).join(",")}`);
  console.log(`Field-aware mapped: ${fieldMapped.map(({ id, expectedScore, topScore, rank, lexicalScore, lexicalTop, lexicalRank }) => `${id}:semantic-r${rank}=${expectedScore.toFixed(6)}/${topScore.toFixed(6)}:bm25-r${lexicalRank}=${lexicalScore.toFixed(3)}/${lexicalTop.toFixed(3)}`).join(",")}`);
  assert.deepEqual(emptyInjections, [], `Condition B injected empty-support questions: ${emptyInjections.join(", ")}`);
  console.log("Gate 3 mapped-recall and empty-support calibration: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
