/**
 * Build-time embedding of every philosopher's curated source excerpts.
 *
 * Run from the project root:  npm run build:embeddings
 * (also runs automatically before `npm run build` via the prebuild hook)
 *
 * Writes src/data/source-embeddings.json: one 384-dim unit vector per source,
 * keyed by philosopher, each tagged with a content hash so the runtime can
 * detect when philosophers.ts changed after this file was generated.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PHILOSOPHERS } from "../src/lib/philosophers";
import {
  EMBEDDING_MODEL,
  embedText,
  hashText,
  sourceEmbeddingText,
  warmEmbedder,
} from "../src/lib/embeddings";

interface StoredVector {
  hash: string;
  vector: number[];
}

async function main() {
  const started = Date.now();
  console.log(`Loading ${EMBEDDING_MODEL} (first run downloads ~25MB)...`);
  await warmEmbedder();
  console.log(`Model ready in ${Date.now() - started}ms. Embedding sources...`);

  const sources: Record<string, StoredVector[]> = {};
  let count = 0;
  for (const philosopher of PHILOSOPHERS) {
    sources[philosopher.id] = [];
    for (const source of philosopher.sources) {
      const text = sourceEmbeddingText(source.label, source.text);
      const vector = await embedText(text);
      sources[philosopher.id].push({
        hash: hashText(text),
        // 6 decimals keeps the file small; the precision loss is far below
        // what affects similarity ranking.
        vector: vector.map((v) => Number(v.toFixed(6))),
      });
      count++;
    }
    console.log(`  ${philosopher.id}: ${philosopher.sources.length} sources`);
  }

  const outPath = path.join(process.cwd(), "src", "data", "source-embeddings.json");
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify({ model: EMBEDDING_MODEL, dims: 384, sources }),
  );
  console.log(`Wrote ${count} vectors to ${outPath} in ${Date.now() - started}ms.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
