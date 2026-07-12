import { Philosopher, SourceExcerpt } from "./types";
import {
  dot,
  embedText,
  hashText,
  isEmbedderReady,
  sourceEmbeddingText,
  warmEmbedder,
} from "./embeddings";
import embeddingData from "@/data/source-embeddings.json";
import {
  getCachedByText,
  getCachedByVector,
  putCached,
} from "./retrieval-cache";

/**
 * Hybrid retrieval over each philosopher's curated source excerpts.
 *
 * Primary scoring is semantic: the query is embedded locally (all-MiniLM) and
 * compared by cosine similarity against vectors precomputed at build time
 * (scripts/build-embeddings.ts) — so "is life worth living?" finds the
 * excerpt about the absurd even with zero shared words. A keyword-overlap
 * term is blended in because tiny embedding models can miss exact names and
 * technical terms that keywords catch trivially.
 *
 * The old pure-keyword scorer is kept as the fallback for whenever the
 * embedding path is unavailable: model still warming up right after server
 * start, vectors stale (philosophers.ts edited without rebuilding), or the
 * model failed to load. Retrieval degrades gracefully; it never blocks.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "being", "as", "at", "by", "it",
  "this", "that", "these", "those", "i", "you", "he", "she", "they", "we",
  "do", "does", "did", "what", "why", "how", "who", "when", "which", "your",
  "about", "would", "could", "should", "can", "will", "not", "no", "yes",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export interface RetrievedSource extends SourceExcerpt {
  score: number;
}

// ---- Precomputed vectors ----------------------------------------------------

interface StoredVector {
  hash: string;
  vector: number[];
}

const PREBUILT = embeddingData as {
  model: string;
  dims: number;
  sources: Record<string, StoredVector[]>;
};

const staleWarned = new Set<string>();

/**
 * Vectors for a philosopher's sources, index-aligned with
 * `philosopher.sources` — or null when missing/stale, in which case the
 * caller uses keyword scoring.
 */
function vectorsFor(philosopher: Philosopher): StoredVector[] | null {
  const stored = PREBUILT.sources[philosopher.id];
  const fresh =
    stored &&
    stored.length === philosopher.sources.length &&
    philosopher.sources.every(
      (s, i) => stored[i].hash === hashText(sourceEmbeddingText(s.label, s.text)),
    );
  if (!fresh) {
    if (!staleWarned.has(philosopher.id)) {
      staleWarned.add(philosopher.id);
      console.warn(
        `[retrieval] embeddings for "${philosopher.id}" are missing or stale; ` +
          "using keyword scoring. Run: npm run build:embeddings",
      );
    }
    return null;
  }
  return stored;
}

// ---- Scoring ------------------------------------------------------------------

/** Fraction of "4+ overlapping keywords", capped at 1. */
function keywordFraction(queryTokens: Set<string>, source: SourceExcerpt): number {
  let overlap = 0;
  for (const token of tokenize(`${source.label} ${source.text}`)) {
    if (queryTokens.has(token)) overlap++;
  }
  return Math.min(1, overlap / 4);
}

/**
 * Blend of semantic and keyword evidence. Cosine dominates (meaning), the
 * keyword term breaks ties and rescues exact-name matches.
 */
export function hybridScore(cosine: number, keywordFrac: number): number {
  return 0.75 * cosine + 0.25 * keywordFrac;
}

/**
 * Relevance threshold, set from measured scores (scripts/retrieval-check.ts):
 * unrelated queries land around 0.03, true matches 0.17+. 0.15 sits in the
 * gap — permissive on purpose, since a marginal grounding note is cheap but a
 * missed one defeats the point of retrieval.
 */
export const RETRIEVAL_MIN_SCORE = 0.15;

/**
 * Latency budget for the embedding step. Warm, it takes ~10-30ms; if it ever
 * exceeds this (cold model, busy machine), keyword results ship instead —
 * retrieval is a nice-to-have and must never stall the voice pipeline.
 */
export const RETRIEVAL_TIMEOUT_MS = 150;

// Dev-only latency log: which path answered a retrieval and how long it took.
// One line per call, e.g. `[retrieval] camus · cache hit (exact text) · 0.2ms`.
const DEV = process.env.NODE_ENV === "development";
function logRetrieval(philosopherId: string, path: string, startedAt: number): void {
  if (!DEV) return;
  const ms = (performance.now() - startedAt).toFixed(1);
  console.log(`[retrieval] ${philosopherId} · ${path} · ${ms}ms`);
}

/** Resolve to null if `promise` has not settled within `ms`. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Cache entries hold every source scored; apply the caller's limits here. */
function applyLimits(
  scored: RetrievedSource[],
  maxResults: number,
  minScore: number,
): RetrievedSource[] {
  return scored.filter((s) => s.score >= minScore).slice(0, maxResults);
}

/**
 * Keyword-only scoring — the zero-dependency fallback path.
 */
export function retrieveSourcesKeyword(
  philosopher: Philosopher,
  query: string,
  { maxResults = 2, minScore = 2 }: { maxResults?: number; minScore?: number } = {},
): RetrievedSource[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = philosopher.sources.map((source) => {
    const sourceTokens = tokenize(`${source.label} ${source.text}`);
    let score = 0;
    for (const token of sourceTokens) {
      if (queryTokens.has(token)) score += 1;
    }
    return { ...source, score };
  });

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Return the most relevant curated excerpts for a query, above a minimum
 * score. Returns [] when nothing is clearly relevant — that is the common
 * case, and the model then answers from the system prompt alone.
 *
 * Uses hybrid (embedding + keyword) scoring when the model is warm and the
 * prebuilt vectors match the current sources; keyword scoring otherwise.
 */
export async function retrieveSources(
  philosopher: Philosopher,
  query: string,
  { maxResults = 2, minScore = RETRIEVAL_MIN_SCORE }: { maxResults?: number; minScore?: number } = {},
): Promise<RetrievedSource[]> {
  const startedAt = performance.now();

  // Prefetched while the user was still talking? Free, instant answer.
  const cachedText = getCachedByText(philosopher.id, query);
  if (cachedText) {
    logRetrieval(philosopher.id, "cache hit (exact text)", startedAt);
    return applyLimits(cachedText, maxResults, minScore);
  }

  const vectors = vectorsFor(philosopher);
  if (!vectors || !isEmbedderReady()) {
    // Kick off (or retry) the model load for future requests, then serve
    // this one from keywords rather than waiting.
    void warmEmbedder();
    logRetrieval(philosopher.id, "keyword fallback (embedder cold)", startedAt);
    return retrieveSourcesKeyword(philosopher, query, { maxResults });
  }

  const queryVector = await withTimeout(embedText(query), RETRIEVAL_TIMEOUT_MS);
  if (!queryVector) {
    logRetrieval(philosopher.id, "keyword fallback (embed timeout)", startedAt);
    return retrieveSourcesKeyword(philosopher, query, { maxResults });
  }

  // A near-identical query already cached (interim vs. final transcript)?
  const cachedVector = getCachedByVector(philosopher.id, queryVector);
  if (cachedVector) {
    logRetrieval(philosopher.id, "cache hit (semantic)", startedAt);
    return applyLimits(cachedVector, maxResults, minScore);
  }

  const queryTokens = new Set(tokenize(query));
  const scored = philosopher.sources
    .map((source, i) => ({
      ...source,
      score: hybridScore(
        dot(queryVector, vectors[i].vector),
        keywordFraction(queryTokens, source),
      ),
    }))
    .sort((a, b) => b.score - a.score);

  putCached(philosopher.id, query, queryVector, scored);
  logRetrieval(philosopher.id, "cache miss (fresh hybrid scoring)", startedAt);
  return applyLimits(scored, maxResults, minScore);
}

/** Format retrieved excerpts as a grounding note for the system prompt. */
export function formatGrounding(sources: RetrievedSource[]): string {
  if (sources.length === 0) return "";
  const lines = sources
    .map((s) => `- ${s.label}: ${s.text}`)
    .join("\n");
  return [
    "Relevant source material for grounding (use it to stay accurate; do not read citations aloud, and do not quote verbatim unless you are certain):",
    lines,
  ].join("\n");
}
