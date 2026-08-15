import { beforeEach, describe, expect, it, vi } from "vitest";
import embeddingData from "@/data/source-embeddings.json";

// Mock only the model-dependent pieces of the embeddings module: tests must
// not download or run the real ONNX model. Pure helpers (hash, dot) stay real.
const mocks = vi.hoisted(() => ({
  ready: false,
  queryVector: [] as number[],
}));

vi.mock("./embeddings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./embeddings")>();
  return {
    ...actual,
    warmEmbedder: vi.fn(async () => {}),
    isEmbedderReady: () => mocks.ready,
    embedText: vi.fn(async () => mocks.queryVector),
  };
});

import { getPhilosopher } from "./philosophers";
import { embedText, hashText, sourceEmbeddingText } from "./embeddings";
import { clearRetrievalCache } from "./retrieval-cache";
import {
  CORPUS_INJECTION_MIN_SCORE,
  corpusCandidatesPassInjectionGate,
  RETRIEVABLE_CORPUS_TYPES,
  RETRIEVAL_MIN_SCORE,
  defaultRetrievalMinScore,
  hybridScore,
  retrieveSources,
  retrieveSourcesKeyword,
  sourcesForCondition,
  storedVectorsAreFresh,
  type StoredCorpusVector,
} from "./retrieval";

const camus = getPhilosopher("camus")!;
const kierkegaard = getPhilosopher("kierkegaard")!;

beforeEach(() => {
  mocks.ready = false;
  mocks.queryVector = [];
  clearRetrievalCache();
  vi.mocked(embedText).mockClear();
});

describe("hybridScore", () => {
  it("blends cosine (dominant) with keyword fraction", () => {
    expect(hybridScore(0.4, 0)).toBeCloseTo(0.3);
    expect(hybridScore(0.4, 1)).toBeCloseTo(0.55);
    expect(hybridScore(0, 0)).toBe(0);
  });
});

describe("condition-specific injection threshold", () => {
  it("keeps A/C at the established threshold and makes experimental B conservative", () => {
    expect(defaultRetrievalMinScore("A")).toBe(RETRIEVAL_MIN_SCORE);
    expect(defaultRetrievalMinScore("C")).toBe(RETRIEVAL_MIN_SCORE);
    expect(defaultRetrievalMinScore("B")).toBe(CORPUS_INJECTION_MIN_SCORE);
    expect(CORPUS_INJECTION_MIN_SCORE).toBeGreaterThan(RETRIEVAL_MIN_SCORE);
  });
});

describe("Condition B calibrated candidate gate", () => {
  // The gate is a pure scoring seam and does not inspect `type`; the fixtures
  // use a retrievable type so nothing here implies cards can reach it.
  const candidate = (id: string, score: number, text: string) => ({
    id,
    score,
    type: "verified_quote" as const,
    philosopher: "camus",
    label: id,
    text,
  });

  it("accepts the original high-confidence semantic path", () => {
    expect(corpusCandidatesPassInjectionGate([
      candidate("high", 0.70, "unrelated wording"),
      candidate("second", 0.40, "other wording"),
    ], "a question")).toBe(true);
  });

  it("accepts semantic and BM25 top-two agreement at the consensus floor", () => {
    expect(corpusCandidatesPassInjectionGate([
      candidate("semantic", 0.61, "revolution rebellion concrete signs"),
      candidate("second", 0.55, "other material"),
      candidate("third", 0.50, "revolution"),
    ], "what concrete signs show true rebellion after revolution")).toBe(true);
  });

  it("accepts a sufficiently dominant semantic winner", () => {
    expect(corpusCandidatesPassInjectionGate([
      candidate("winner", 0.59, "semantic paraphrase only"),
      candidate("second", 0.50, "other material"),
      candidate("lexical", 0.49, "pacifist violence always wrong"),
    ], "was he a pacifist who thought violence was always wrong")).toBe(true);
  });

  it("rejects a sub-threshold semantic result without lexical consensus or dominance", () => {
    expect(corpusCandidatesPassInjectionGate([
      candidate("semantic", 0.64, "no lexical overlap"),
      candidate("second", 0.60, "also unrelated"),
      candidate("lexical-one", 0.50, "ontological argument existence essence"),
      candidate("lexical-two", 0.49, "ontological argument concept god"),
    ], "explain the ontological argument from the concept of God")).toBe(false);
  });
});

describe("retrieveSourcesKeyword", () => {
  it("finds a source by keyword overlap", () => {
    const results = retrieveSourcesKeyword(camus, "the myth of Sisyphus and the absurd");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toContain("Sisyphus");
  });

  it("returns nothing for an unrelated query", () => {
    expect(retrieveSourcesKeyword(camus, "favorite pizza topping")).toEqual([]);
  });
});

describe("condition source isolation", () => {
  const camusCard: StoredCorpusVector = {
    id: "card:camus:limits",
    type: "position_card",
    philosopher: "camus",
    title: "Limits",
    claim: "Revolt discovers limits.",
    explanation: "The rebel's no also affirms a shared value.",
    citations: ["The Rebel, Part I"],
    provenance: "SEP corpus audit",
    status: "draft",
    sourcePath: "data/rag/cards/drafts/camus.md",
    label: "Limits (The Rebel, Part I)",
    text: "Claim: Revolt discovers limits.",
    hash: "fixture-camus-card",
    vector: [1, 0],
  };
  const camusQuote: StoredCorpusVector = {
    id: "quote:camus:the-rebel-part-i:i-rebel-therefore-we-are",
    type: "verified_quote",
    philosopher: "camus",
    title: "The Rebel — The Rebel, Part I",
    claim: "I rebel, therefore we are.",
    explanation: "Verbatim wording verified against the cited source.",
    citations: ["The Rebel, Part I"],
    provenance: "fixture",
    status: "verified — fixture",
    sourcePath: "data/rag/quotes/drafts/camus.json",
    label: "The Rebel — The Rebel, Part I [verified quotation]",
    text: "Verified quotation: “I rebel, therefore we are.”",
    hash: "fixture-camus-quote",
    vector: [0, 1],
  };
  const nietzscheCard: StoredCorpusVector = {
    ...camusCard,
    id: "card:nietzsche:perspectivism",
    philosopher: "nietzsche",
    title: "Perspectivism",
    label: "Perspectivism (Beyond Good and Evil)",
    hash: "fixture-nietzsche-card",
  };
  const nietzscheQuote: StoredCorpusVector = {
    ...camusQuote,
    id: "quote:nietzsche:bge-146:he-who-fights-with-monsters",
    philosopher: "nietzsche",
    label: "Beyond Good and Evil — BGE §146 [verified quotation]",
    hash: "fixture-nietzsche-quote",
  };
  const corpus = {
    camus: [camusCard, camusQuote],
    nietzsche: [nietzscheCard, nietzscheQuote],
  };

  it("never exposes a position card to any condition", () => {
    expect(RETRIEVABLE_CORPUS_TYPES.has("position_card")).toBe(false);

    for (const condition of ["A", "B", "C"] as const) {
      const selected = sourcesForCondition(camus, condition, corpus);
      expect(selected.some((source) => source.type === "position_card")).toBe(false);
      expect(selected.some((source) => source.id === camusCard.id)).toBe(false);
    }
  });

  it("exposes only same-philosopher retrievable corpus sources to B and preserves their metadata", () => {
    const selected = sourcesForCondition(camus, "B", corpus);
    const selectedQuote = selected.find((source) => source.id === camusQuote.id);

    expect(selectedQuote).toEqual({
      id: camusQuote.id,
      type: "verified_quote",
      philosopher: "camus",
      title: "The Rebel — The Rebel, Part I",
      claim: "I rebel, therefore we are.",
      explanation: "Verbatim wording verified against the cited source.",
      citations: ["The Rebel, Part I"],
      provenance: "fixture",
      status: "verified — fixture",
      sourcePath: "data/rag/quotes/drafts/camus.json",
      label: "The Rebel — The Rebel, Part I [verified quotation]",
      text: "Verified quotation: “I rebel, therefore we are.”",
    });
    expect(selected.some((source) => source.philosopher === "nietzsche")).toBe(false);
  });

  it("keeps both A and C on curated excerpts even when corpus sources exist", () => {
    const baselineCount = camus.sources.length;

    for (const condition of ["A", "C"] as const) {
      const selected = sourcesForCondition(camus, condition, corpus);
      expect(selected).toHaveLength(baselineCount);
      expect(selected.every((source) => source.type === "curated_excerpt")).toBe(true);
      expect(selected.some((source) => source.id === camusQuote.id)).toBe(false);
    }
  });

  it("gives B only the curated baseline when a philosopher has no retrievable corpus unit", () => {
    const cardsOnly = { camus: [camusCard] };
    const selected = sourcesForCondition(camus, "B", cardsOnly);

    expect(selected).toHaveLength(camus.sources.length);
    expect(selected.every((source) => source.type === "curated_excerpt")).toBe(true);
  });
});

describe("retrieveSources", () => {
  it("detects stale or structurally mismatched prebuilt vectors", () => {
    const source = [{ label: "Stable label", text: "Stable text" }];
    const hash = hashText(sourceEmbeddingText(source[0].label, source[0].text));

    expect(storedVectorsAreFresh(source, [{ hash, vector: [1] }])).toBe(true);
    expect(storedVectorsAreFresh(source, [{ hash: "stale", vector: [1] }])).toBe(false);
    expect(storedVectorsAreFresh(source, [])).toBe(false);
    expect(storedVectorsAreFresh(source, undefined)).toBe(false);
  });

  it("falls back to keyword scoring while the embedder is not ready", async () => {
    mocks.ready = false;
    const results = await retrieveSources(camus, "the myth of Sisyphus and the absurd");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toContain("Sisyphus");
    // Keyword scores are integer overlap counts, not 0-1 hybrid scores.
    expect(Number.isInteger(results[0].score)).toBe(true);
  });

  it("never retrieves a position card on Condition B's keyword fallback", async () => {
    mocks.ready = false;
    // This exact query used to return
    // card:kierkegaard:kierkegaard-did-not-write-the-phrase-leap-of-faith at
    // rank 1 from the real generated index. Cards are now out of scope, so the
    // assertion is inverted: that card must not come back, and the reply falls
    // through to the curated excerpts alone.
    const results = await retrieveSources(
      kierkegaard,
      "Kierkegaard exact phrase leap of faith",
      { condition: "B", maxResults: 3 },
    );

    expect(results.some(
      (result) => result.id === "card:kierkegaard:kierkegaard-did-not-write-the-phrase-leap-of-faith",
    )).toBe(false);
    expect(results.every((result) => result.type !== "position_card")).toBe(true);
    expect(results.every((result) => result.philosopher === "kierkegaard")).toBe(true);
    expect(results.every((result) => Number.isInteger(result.score))).toBe(true);
  });

  it("uses the shipped corpus on Condition B's keyword fallback", async () => {
    mocks.ready = false;
    const nietzsche = getPhilosopher("nietzsche")!;
    const results = await retrieveSources(
      nietzsche,
      "verified quotation he who fights with monsters should be careful",
      { condition: "B", maxResults: 3 },
    );

    expect(results.some(
      (result) => result.id.startsWith("quote:nietzsche:bge-146:"),
    )).toBe(true);
    expect(results.every((result) => result.type !== "position_card")).toBe(true);
  });

  it("ranks by hybrid score when the embedder is ready", async () => {
    mocks.ready = true;
    // Query vector = stored vector of Camus source 0 -> cosine 1 for it.
    const stored = (embeddingData as { sources: Record<string, { vector: number[] }[]> })
      .sources.camus;
    mocks.queryVector = stored[0].vector;

    const results = await retrieveSources(camus, "completely unrelated words here");
    expect(results[0].label).toBe(camus.sources[0].label);
    // cosine 1, no keyword overlap -> 0.75; well above the threshold.
    expect(results[0].score).toBeGreaterThan(0.7);
    expect(results[0].score).toBeGreaterThanOrEqual(RETRIEVAL_MIN_SCORE);
  });

  it("serves a repeated query from cache without re-embedding", async () => {
    mocks.ready = true;
    const stored = (embeddingData as { sources: Record<string, { vector: number[] }[]> })
      .sources.camus;
    mocks.queryVector = stored[0].vector;

    const first = await retrieveSources(camus, "What is the absurd?");
    expect(vi.mocked(embedText)).toHaveBeenCalledTimes(1);

    // Same query up to casing/punctuation: exact-normalized cache hit.
    const second = await retrieveSources(camus, "what is the absurd");
    expect(vi.mocked(embedText)).toHaveBeenCalledTimes(1); // not called again
    expect(second).toEqual(first);
  });

  it("reuses cached results for a near-identical query vector", async () => {
    mocks.ready = true;
    const stored = (embeddingData as { sources: Record<string, { vector: number[] }[]> })
      .sources.camus;
    mocks.queryVector = stored[0].vector;

    // Prefetch-style call with the interim (partial) transcript.
    const prefetched = await retrieveSources(camus, "is life worth livi");
    // Final transcript differs in text, but embeds to the same vector here,
    // so the similarity lookup (cosine >= 0.95) reuses the cached results.
    const final = await retrieveSources(camus, "Is life worth living?");
    expect(final).toEqual(prefetched);
    expect(vi.mocked(embedText)).toHaveBeenCalledTimes(2); // embedded both, scored once
  });
});
