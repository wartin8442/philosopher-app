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
import { embedText } from "./embeddings";
import { clearRetrievalCache } from "./retrieval-cache";
import {
  RETRIEVAL_MIN_SCORE,
  hybridScore,
  retrieveSources,
  retrieveSourcesKeyword,
} from "./retrieval";

const camus = getPhilosopher("camus")!;

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

describe("retrieveSources", () => {
  it("falls back to keyword scoring while the embedder is not ready", async () => {
    mocks.ready = false;
    const results = await retrieveSources(camus, "the myth of Sisyphus and the absurd");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toContain("Sisyphus");
    // Keyword scores are integer overlap counts, not 0-1 hybrid scores.
    expect(Number.isInteger(results[0].score)).toBe(true);
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
