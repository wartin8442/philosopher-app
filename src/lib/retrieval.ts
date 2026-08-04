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
  type ExperimentCondition,
  usesCorpusRetrieval,
} from "./experiment-conditions";
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
  id: string;
  type: "curated_excerpt" | "position_card" | "verified_quote" | "misattribution_warning";
  philosopher: string;
  title?: string;
  claim?: string;
  explanation?: string;
  citations?: string[];
  provenance?: string;
  status?: string;
  sourcePath?: string;
}

// ---- Precomputed vectors ----------------------------------------------------

export interface StoredVector {
  hash: string;
  vector: number[];
}

export interface StoredCorpusVector extends StoredVector, Omit<RetrievedSource, "score"> {}

const PREBUILT = embeddingData as {
  model: string;
  dims: number;
  sources: Record<string, StoredVector[]>;
  corpusSources?: Record<string, StoredCorpusVector[]>;
};

const staleWarned = new Set<string>();

/**
 * Corpus unit types the retrieval path may ever score or inject.
 *
 * `position_card` is deliberately absent. Cards are our own synthesis, and a
 * card that is on-topic and above the injection floor can still be *vaguer*
 * than the model's own parametric knowledge — grounding on it then makes the
 * answer worse. Two confirmed instances drove this narrowing:
 * `card:kierkegaard:the-attack-on-the-danish-state-church` (scored 0.7310,
 * describes Bishop Mynster and Martensen only as "a recently deceased bishop"
 * and "a comfortable, politically-connected church official", regressing a
 * check the ungrounded reply passed), and camus.md's "The Rebel and the Public
 * Break With Sartre" (omits *Les Temps modernes* and Francis Jeanson).
 *
 * What survives is the category the model genuinely cannot self-verify by
 * introspection: exact wording and exact citation location. Common misreadings
 * are handled as static prompt text instead (see `conditionCHardening` in
 * experiment-conditions.ts), because that list is bounded and enumerable.
 *
 * The 257 cards remain on disk and in the generated index as reference
 * material; they are simply never retrievable.
 */
export const RETRIEVABLE_CORPUS_TYPES = new Set<RetrievedSource["type"]>([
  "verified_quote",
  "misattribution_warning",
]);

/**
 * The subset of a philosopher's generated corpus vectors that retrieval may
 * see. Both the source list and the index-aligned vector list are derived from
 * this one filter, so they can never drift out of alignment.
 */
function retrievableCorpus(
  stored: StoredCorpusVector[] | undefined,
): StoredCorpusVector[] {
  return (stored ?? []).filter((unit) => RETRIEVABLE_CORPUS_TYPES.has(unit.type));
}

/** Pure freshness check used by runtime fallback logic and deterministic tests. */
export function storedVectorsAreFresh(
  sources: Pick<SourceExcerpt, "label" | "text">[],
  stored: StoredVector[] | undefined,
): boolean {
  return Boolean(
    stored &&
    stored.length === sources.length &&
    sources.every(
      (source, index) =>
        stored[index].hash === hashText(sourceEmbeddingText(source.label, source.text)),
    ),
  );
}

/**
 * Vectors for a philosopher's sources, index-aligned with
 * `philosopher.sources` — or null when missing/stale, in which case the
 * caller uses keyword scoring.
 */
function baselineSources(philosopher: Philosopher): Omit<RetrievedSource, "score">[] {
  return philosopher.sources.map((source, index) => ({
    ...source,
    id: `source:${philosopher.id}:${index + 1}`,
    type: "curated_excerpt" as const,
    philosopher: philosopher.id,
    title: source.label,
    citations: [source.label],
    provenance: "src/lib/philosophers.ts",
    status: "curated",
    sourcePath: "src/lib/philosophers.ts",
  }));
}

/**
 * Select the sources visible to one experimental condition and philosopher.
 * Kept pure (with an injectable corpus map) so the A/B/C isolation contract
 * can be proved without generating or mutating the embedding artifact.
 *
 * Position cards are filtered out here rather than at index-build time, so the
 * generated artifact stays byte-identical and the cards remain inspectable.
 */
export function sourcesForCondition(
  philosopher: Philosopher,
  condition: ExperimentCondition,
  corpusSources: Record<string, StoredCorpusVector[]> | undefined = PREBUILT.corpusSources,
): Omit<RetrievedSource, "score">[] {
  const baseline = baselineSources(philosopher);
  if (!usesCorpusRetrieval(condition)) return baseline;
  const corpus = retrievableCorpus(corpusSources?.[philosopher.id]);
  return [...baseline, ...corpus.map(({ vector: _vector, hash: _hash, ...source }) => source)];
}

function vectorsFor(
  philosopher: Philosopher,
  condition: ExperimentCondition,
): StoredVector[] | null {
  const stored = PREBUILT.sources[philosopher.id];
  const baselineFresh = storedVectorsAreFresh(philosopher.sources, stored);
  const indexed = usesCorpusRetrieval(condition)
    ? PREBUILT.corpusSources?.[philosopher.id]
    : undefined;
  const corpus = retrievableCorpus(indexed);
  // An empty retrievable corpus is now the normal case for four of the five
  // philosophers (only Nietzsche has verified quotes), so emptiness is no
  // longer a staleness signal — a missing philosopher key still is.
  const corpusFresh = !usesCorpusRetrieval(condition) || (
    indexed !== undefined &&
    storedVectorsAreFresh(corpus, corpus)
  );
  if (!baselineFresh || !corpusFresh) {
    const warningKey = `${condition}:${philosopher.id}`;
    if (!staleWarned.has(warningKey)) {
      staleWarned.add(warningKey);
      console.warn(
        `[retrieval] ${condition} embeddings for "${philosopher.id}" are missing or stale; ` +
          "using keyword scoring. Run: npm run build:embeddings",
      );
    }
    return null;
  }
  return usesCorpusRetrieval(condition) ? [...stored, ...corpus] : stored;
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
 * Injection floor for Condition B.
 *
 * Re-measured 2026-07-23 against the narrowed corpus (10 retrievable units:
 * 3 verified quotes, 7 misattribution warnings) using the exact frozen pilot
 * question wording:
 *
 *   true positives   aq-14 0.7013 · kg-15 0.7769 · nz-36 0.7721
 *   empty-support    max 0.3054 (kg-10); the other nine sentinels 0.0000-0.2583
 *
 * That is a ~0.40-wide gap, against ~0.075 under the old card-heavy corpus
 * (empty-support max 0.6387 vs. lowest true positive 0.7136). Dropping the
 * cards is what made the injection decision easy: 0.67 now sits in open space
 * rather than threaded between two nearly-touching distributions.
 *
 * The value is unchanged, but it is no longer load-bearing in the way it was —
 * anything from roughly 0.35 to 0.70 separates these two sets. It is kept at
 * 0.67 because the evidence is still only three positives; widening the gate
 * on that basis would be guessing in the permissive direction.
 *
 * Known recall miss: nz-19 scores its (genuine) Zarathustra quote at only
 * 0.4533 and so injects nothing. See docs/rag_narrowed_scope_recalibration.md —
 * that question also has a defective answer key and should not be used to
 * tune this number.
 */
export const CORPUS_INJECTION_MIN_SCORE = 0.67;

/**
 * Secondary gates for Condition B, originally added (r6) to rescue
 * semantically correct *cards* the single cutoff missed. With cards out of
 * scope they no longer serve that purpose. They are retained because the
 * re-measurement above shows they cannot currently do harm — the highest
 * empty-support score is 0.3054, far below even the 0.58 dominant floor — but
 * they are now redundant machinery and are the first thing to delete if this
 * gate is ever simplified.
 */
export const CORPUS_CONSENSUS_MIN_SCORE = 0.60;
export const CORPUS_DOMINANT_MIN_SCORE = 0.58;
export const CORPUS_DOMINANT_MIN_MARGIN = 0.08;

export function defaultRetrievalMinScore(condition: ExperimentCondition): number {
  return usesCorpusRetrieval(condition)
    ? CORPUS_INJECTION_MIN_SCORE
    : RETRIEVAL_MIN_SCORE;
}

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
function bm25Ranked(scored: RetrievedSource[], query: string): RetrievedSource[] {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0 || scored.length === 0) return [];
  const documentTokens = scored.map((source) => tokenize(`${source.label} ${source.text}`));
  const averageLength = documentTokens.reduce((sum, tokens) => sum + tokens.length, 0) /
    documentTokens.length;
  const documentFrequency = new Map<string, number>();
  for (const tokens of documentTokens) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const k1 = 1.2;
  const b = 0.75;
  return scored.map((source, index) => {
    const tokens = documentTokens[index];
    const frequencies = new Map<string, number>();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    let score = 0;
    for (const token of queryTokens) {
      const frequency = frequencies.get(token) ?? 0;
      if (frequency === 0) continue;
      const df = documentFrequency.get(token) ?? 0;
      const idf = Math.log(1 + (scored.length - df + 0.5) / (df + 0.5));
      score += idf * (frequency * (k1 + 1)) /
        (frequency + k1 * (1 - b + b * tokens.length / averageLength));
    }
    return { ...source, score };
  }).sort((left, right) => right.score - left.score);
}

/** Pure Condition B acceptance seam used by deterministic calibration tests. */
export function corpusCandidatesPassInjectionGate(
  semanticRanked: RetrievedSource[],
  query: string,
): boolean {
  const top = semanticRanked[0];
  if (!top) return false;
  if (top.score >= CORPUS_INJECTION_MIN_SCORE) return true;

  const semanticTopTwo = new Set(semanticRanked.slice(0, 2).map((source) => source.id));
  const lexicalTopTwo = bm25Ranked(semanticRanked, query).slice(0, 2);
  const consensus = lexicalTopTwo.some((source) => semanticTopTwo.has(source.id));
  if (top.score >= CORPUS_CONSENSUS_MIN_SCORE && consensus) return true;

  const margin = top.score - (semanticRanked[1]?.score ?? 0);
  return top.score >= CORPUS_DOMINANT_MIN_SCORE && margin >= CORPUS_DOMINANT_MIN_MARGIN;
}

function applyLimits(
  scored: RetrievedSource[],
  query: string,
  condition: ExperimentCondition,
  maxResults: number,
  minScore: number,
  usesDefaultThreshold: boolean,
): RetrievedSource[] {
  if (usesCorpusRetrieval(condition) && usesDefaultThreshold) {
    return corpusCandidatesPassInjectionGate(scored, query) ? scored.slice(0, maxResults) : [];
  }
  return scored.filter((s) => s.score >= minScore).slice(0, maxResults);
}

/**
 * Keyword-only scoring — the zero-dependency fallback path.
 */
export function retrieveSourcesKeyword(
  philosopher: Philosopher,
  query: string,
  {
    maxResults = 2,
    minScore = 2,
    condition = "A",
  }: { maxResults?: number; minScore?: number; condition?: ExperimentCondition } = {},
): RetrievedSource[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = sourcesForCondition(philosopher, condition).map((source) => {
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
  {
    maxResults = 2,
    minScore,
    condition = "A",
  }: { maxResults?: number; minScore?: number; condition?: ExperimentCondition } = {},
): Promise<RetrievedSource[]> {
  const startedAt = performance.now();
  const cacheScope = condition;
  const usesDefaultThreshold = minScore === undefined;
  const effectiveMinScore = minScore ?? defaultRetrievalMinScore(condition);

  // Prefetched while the user was still talking? Free, instant answer.
  const cachedText = getCachedByText(philosopher.id, query, cacheScope);
  if (cachedText) {
    logRetrieval(philosopher.id, "cache hit (exact text)", startedAt);
    return applyLimits(cachedText, query, condition, maxResults, effectiveMinScore, usesDefaultThreshold);
  }

  const vectors = vectorsFor(philosopher, condition);
  if (!vectors || !isEmbedderReady()) {
    // Kick off (or retry) the model load for future requests, then serve
    // this one from keywords rather than waiting.
    void warmEmbedder();
    logRetrieval(philosopher.id, "keyword fallback (embedder cold)", startedAt);
    return retrieveSourcesKeyword(philosopher, query, { maxResults, condition });
  }

  const queryVector = await withTimeout(embedText(query), RETRIEVAL_TIMEOUT_MS);
  if (!queryVector) {
    logRetrieval(philosopher.id, "keyword fallback (embed timeout)", startedAt);
    return retrieveSourcesKeyword(philosopher, query, { maxResults, condition });
  }

  // A near-identical query already cached (interim vs. final transcript)?
  const cachedVector = getCachedByVector(philosopher.id, queryVector, cacheScope);
  if (cachedVector) {
    logRetrieval(philosopher.id, "cache hit (semantic)", startedAt);
    return applyLimits(cachedVector, query, condition, maxResults, effectiveMinScore, usesDefaultThreshold);
  }

  const queryTokens = new Set(tokenize(query));
  const scored = sourcesForCondition(philosopher, condition)
    .map((source, i) => ({
      ...source,
      score: hybridScore(
        dot(queryVector, vectors[i].vector),
        keywordFraction(queryTokens, source),
      ),
    }))
    .sort((a, b) => b.score - a.score);

  putCached(philosopher.id, query, queryVector, scored, cacheScope);
  logRetrieval(philosopher.id, "cache miss (fresh hybrid scoring)", startedAt);
  return applyLimits(scored, query, condition, maxResults, effectiveMinScore, usesDefaultThreshold);
}

/** Format retrieved excerpts as a grounding note for the system prompt. */
export function formatGrounding(sources: RetrievedSource[]): string {
  if (sources.length === 0) return "";
  const lines = sources
    .map((s) => {
      // The position_card arm is unreachable through retrieval (cards are not
      // in RETRIEVABLE_CORPUS_TYPES); it is kept only so a hand-built source
      // list still formats rather than falling through to "CURATED EXCERPT".
      const kind = s.type === "position_card"
        ? `DRAFT POSITION CARD ${s.id}`
        : s.type === "verified_quote"
          ? `VERIFIED QUOTATION ${s.id}`
          : s.type === "misattribution_warning"
            ? `MISATTRIBUTION WARNING ${s.id} — never present the warned text as genuine`
            : `CURATED EXCERPT ${s.id}`;
      const support = s.citations?.length ? ` Citations: ${s.citations.join("; ")}.` : "";
      const provenance = s.provenance ? ` Provenance: ${s.provenance}.` : "";
      const status = s.status ? ` Verification status: ${s.status}.` : "";
      return `- [${kind}] ${s.label}: ${s.text}${support}${provenance}${status}`;
    })
    .join("\n");
  return [
    "Relevant source material for grounding (use it to stay accurate; do not read citations aloud, and do not quote verbatim unless you are certain):",
    lines,
  ].join("\n");
}
