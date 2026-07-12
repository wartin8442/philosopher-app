import type { RetrievedSource } from "./retrieval";
import { dot } from "./embeddings";

/**
 * Small in-memory LRU cache for retrieval results, keyed per philosopher.
 *
 * Why it exists: while the user is still speaking, the client prefetches
 * retrieval for the interim transcript (/api/retrieve). By the time the final
 * transcript hits /api/chat, the scored results are usually already here, so
 * that request pays zero retrieval latency.
 *
 * Two lookup paths:
 * 1. Exact (normalized text) — free: no embedding work at all. Catches the
 *    common case where the final transcript matches the last interim one up
 *    to casing/punctuation.
 * 2. Semantic (query-vector cosine >= SIMILARITY_THRESHOLD) — catches "the
 *    interim guess was a few words short of the final sentence". Costs one
 *    query embedding, which the caller needed anyway to score sources.
 *
 * Entries store ALL sources with scores (unfiltered, sorted desc) so callers
 * with different thresholds/limits share the same entries.
 */

const MAX_ENTRIES = 64;
const TTL_MS = 5 * 60 * 1000;
const SIMILARITY_THRESHOLD = 0.95;

interface CacheEntry {
  queryVector: number[];
  results: RetrievedSource[];
  expiresAt: number;
}

// Map preserves insertion order: oldest-inserted first. On every hit the
// entry is re-inserted, so the first key is always the least recently used.
const cache = new Map<string, CacheEntry>();

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cacheKey(philosopherId: string, query: string): string {
  return `${philosopherId}::${normalizeQuery(query)}`;
}

function touch(key: string, entry: CacheEntry): void {
  cache.delete(key);
  cache.set(key, entry);
}

/** Exact-text lookup (normalized). Free — call before any embedding work. */
export function getCachedByText(
  philosopherId: string,
  query: string,
): RetrievedSource[] | null {
  const key = cacheKey(philosopherId, query);
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  touch(key, entry);
  return entry.results;
}

/** Similarity lookup among this philosopher's cached query vectors. */
export function getCachedByVector(
  philosopherId: string,
  queryVector: number[],
): RetrievedSource[] | null {
  const prefix = `${philosopherId}::`;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (!key.startsWith(prefix)) continue;
    if (entry.expiresAt < now) {
      cache.delete(key);
      continue;
    }
    if (dot(queryVector, entry.queryVector) >= SIMILARITY_THRESHOLD) {
      touch(key, entry);
      return entry.results;
    }
  }
  return null;
}

export function putCached(
  philosopherId: string,
  query: string,
  queryVector: number[],
  results: RetrievedSource[],
): void {
  const key = cacheKey(philosopherId, query);
  cache.delete(key);
  cache.set(key, { queryVector, results, expiresAt: Date.now() + TTL_MS });
  // Evict least recently used until back under the cap.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value as string;
    cache.delete(oldest);
  }
}

/** Test hook. */
export function clearRetrievalCache(): void {
  cache.clear();
}
