import type { FeatureExtractionPipeline } from "@xenova/transformers";

/**
 * Local text embeddings via ONNX (all-MiniLM-L6-v2, ~25MB, no API key).
 *
 * An embedding maps text to a 384-number vector positioned so that texts with
 * similar *meaning* get nearby vectors. Curated source excerpts are embedded
 * once at build time (scripts/build-embeddings.ts); at request time only the
 * user's short question is embedded, then compared against the precomputed
 * vectors by cosine similarity.
 *
 * The model loads once per server process. `warmEmbedder()` is called from
 * instrumentation at server start so the first user request never pays the
 * load. Until the model is ready, callers check `isEmbedderReady()` and fall
 * back to keyword scoring — retrieval must never add seconds of latency.
 */

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

/**
 * Model state lives on globalThis, not in module variables: Next.js compiles
 * instrumentation.ts and each route into separate bundles, and each bundle
 * gets its own copy of this module. globalThis is shared by the whole Node
 * process, so the model the boot-time warm-up loads is the same one requests
 * find ready.
 */
interface EmbedderState {
  extractor: FeatureExtractionPipeline | null;
  promise: Promise<FeatureExtractionPipeline> | null;
}

const state: EmbedderState = ((
  globalThis as { __philosopherEmbedder?: EmbedderState }
).__philosopherEmbedder ??= { extractor: null, promise: null });

/** Begin loading the model (idempotent). Resolves when it is ready. */
export function warmEmbedder(): Promise<void> {
  if (!state.promise) {
    state.promise = (async () => {
      // Dynamic import: the library (and its native ONNX runtime) is only
      // pulled in server-side, and only when embeddings are actually wanted.
      const { pipeline } = await import("@xenova/transformers");
      const pipe = await pipeline("feature-extraction", EMBEDDING_MODEL, {
        quantized: true,
      });
      state.extractor = pipe;
      return pipe;
    })();
    state.promise.catch((err) => {
      console.error("[embeddings] model failed to load:", err);
      state.promise = null; // allow a retry on the next warm call
    });
  }
  return state.promise.then(() => undefined);
}

/** True once the model is loaded and `embedText` will be fast (~ms). */
export function isEmbedderReady(): boolean {
  return state.extractor !== null;
}

/**
 * Embed one text into a unit-length vector. With both vectors normalized to
 * length 1, cosine similarity reduces to a plain dot product.
 */
export async function embedText(text: string): Promise<number[]> {
  const pipe =
    state.extractor ?? (await (state.promise ?? warmEmbedderAndGet()));
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

async function warmEmbedderAndGet(): Promise<FeatureExtractionPipeline> {
  await warmEmbedder();
  return state.extractor!;
}

/** Dot product = cosine similarity for unit-length vectors. */
export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Cheap content fingerprint (djb2). Stored next to each prebuilt vector so a
 * source edited in philosophers.ts after the last embedding build is detected
 * at runtime (stale vector -> keyword fallback) instead of silently scoring
 * against the wrong text.
 */
export function hashText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** The exact string embedded for a source excerpt (build + staleness check). */
export function sourceEmbeddingText(label: string, text: string): string {
  return `${label}. ${text}`;
}
