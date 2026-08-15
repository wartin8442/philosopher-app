/**
 * Build-time embedding of every philosopher's curated source excerpts and
 * every corpus unit admitted by the RAG eligibility rules.
 *
 * Run from the project root:  npm run build:embeddings
 * (also runs automatically before `npm run build` via the prebuild hook)
 *
 * Writes the version-2 src/data/source-embeddings.json artifact: one 384-dim
 * unit vector per source, keyed by philosopher, each tagged with a content hash
 * so the runtime can detect when source material changed after generation.
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
import {
  loadEligibleCorpusUnits,
  type CorpusUnit,
} from "./rag-corpus";

interface StoredVector {
  hash: string;
  vector: number[];
}

interface StoredCorpusVector extends CorpusUnit, StoredVector {}

function roundedVector(vector: number[]): number[] {
  // Six decimals keeps the generated file manageable; the precision loss is
  // far below what affects similarity ranking.
  return vector.map((value) => Number(value.toFixed(6)));
}

async function storedVector(label: string, text: string): Promise<StoredVector> {
  const embeddingText = sourceEmbeddingText(label, text);
  return {
    hash: hashText(embeddingText),
    vector: roundedVector(await embedText(embeddingText)),
  };
}

async function main() {
  const started = Date.now();
  console.log(`Loading ${EMBEDDING_MODEL} (first run downloads ~25MB)...`);
  await warmEmbedder();
  console.log(`Model ready in ${Date.now() - started}ms. Embedding sources...`);

  const sources: Record<string, StoredVector[]> = {};
  const corpusSources: Record<string, StoredCorpusVector[]> = {};
  let curatedCount = 0;
  for (const philosopher of PHILOSOPHERS) {
    sources[philosopher.id] = [];
    corpusSources[philosopher.id] = [];
    for (const source of philosopher.sources) {
      sources[philosopher.id].push(
        await storedVector(source.label, source.text),
      );
      curatedCount++;
    }
    console.log(`  ${philosopher.id}: ${philosopher.sources.length} sources`);
  }

  const corpus = loadEligibleCorpusUnits();
  for (const unit of corpus) {
    const bucket = corpusSources[unit.philosopher];
    if (!bucket) {
      throw new Error(
        `Corpus unit "${unit.id}" names unknown philosopher "${unit.philosopher}"`,
      );
    }
    bucket.push({
      ...unit,
      ...(await storedVector(unit.label, unit.text)),
    });
  }

  for (const [philosopher, units] of Object.entries(corpusSources)) {
    if (units.length > 0) console.log(`  ${philosopher}: ${units.length} corpus units`);
  }

  const outPath = path.join(process.cwd(), "src", "data", "source-embeddings.json");
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify({
      version: 2,
      model: EMBEDDING_MODEL,
      dims: 384,
      sources,
      corpusSources,
    }),
  );
  console.log(
    `Wrote ${curatedCount} curated and ${corpus.length} corpus vectors ` +
      `to ${outPath} in ${Date.now() - started}ms.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
