/**
 * Stage-2 ingestion: Beyond Good and Evil, Helen Zimmern translation
 * (public domain; Project Gutenberg #4363). Manifest entry:
 * nietzsche-beyond-good-and-evil-zimmern.
 *
 * Chunking per the manifest: one numbered aphorism per chunk, citation ID
 * "BGE §n". The preface is its own chunk. The appended poem "From the
 * Heights" is excluded (different translator, L.A. Magnus).
 *
 * Usage:
 *   npx tsx scripts/ingest-bge-zimmern.ts [path-to-pg4363.txt]
 * With no argument, downloads from Project Gutenberg.
 *
 * Output: data/rag/texts/nietzsche-beyond-good-and-evil-zimmern/chunks.json
 */
import fs from "node:fs";
import path from "node:path";

const SOURCE_ID = "nietzsche-beyond-good-and-evil-zimmern";
const GUTENBERG_URL = "https://www.gutenberg.org/cache/epub/4363/pg4363.txt";
const OUT_DIR = path.join("data", "rag", "texts", SOURCE_ID);

interface Chunk {
  id: string;
  work: "Beyond Good and Evil";
  citation: string; // "BGE §36" | "BGE Preface"
  chapter: string;
  aphorism: number | null; // null for the preface
  text: string;
}

async function loadRaw(): Promise<string> {
  const arg = process.argv[2];
  if (arg) return fs.readFileSync(arg, "utf8");
  const res = await fetch(GUTENBERG_URL);
  if (!res.ok) throw new Error(`Gutenberg fetch failed: ${res.status}`);
  return await res.text();
}

/** Join hard-wrapped lines into paragraphs; blank lines separate paragraphs. */
function unwrap(lines: string[]): string {
  const paras: string[] = [];
  let cur: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (cur.length) paras.push(cur.join(" "));
      cur = [];
    } else {
      cur.push(line.trim());
    }
  }
  if (cur.length) paras.push(cur.join(" "));
  return paras.join("\n\n").trim();
}

async function main() {
  const raw = await loadRaw();

  // Strip Gutenberg boilerplate.
  const start = raw.indexOf("*** START OF THE PROJECT GUTENBERG EBOOK");
  const end = raw.indexOf("*** END OF THE PROJECT GUTENBERG EBOOK");
  if (start === -1 || end === -1) throw new Error("Gutenberg markers not found");
  const body = raw.slice(raw.indexOf("\n", start) + 1, end);

  const lines = body.split(/\r?\n/);

  const chapterRe = /^CHAPTER ([IVX]+)\.\s+(.+)$/;
  const aphorismRe = /^(\d+)\.\s?(.*)$/;

  const chunks: Chunk[] = [];
  let chapter = "";
  let expected = 1; // aphorisms are numbered continuously 1..296
  let current: { num: number | null; buf: string[] } | null = null;
  let inPreface = false;
  let done = false;

  const flush = () => {
    if (!current) return;
    const text = unwrap(current.buf);
    if (!text) return;
    if (current.num === null) {
      chunks.push({
        id: "bge-preface",
        work: "Beyond Good and Evil",
        citation: "BGE Preface",
        chapter: "Preface",
        aphorism: null,
        text,
      });
    } else {
      chunks.push({
        id: `bge-${String(current.num).padStart(3, "0")}`,
        work: "Beyond Good and Evil",
        citation: `BGE §${current.num}`,
        chapter,
        aphorism: current.num,
        text,
      });
    }
    current = null;
  };

  for (const line of lines) {
    if (done) break;
    const t = line.trim();

    if (t === "FROM THE HEIGHTS") {
      // Appended poem, different translator — end of ingested content.
      flush();
      done = true;
      continue;
    }
    if (t === "PREFACE") {
      // "PREFACE" appears twice: once in the table of contents, once as the
      // real heading. Restart the buffer on each occurrence so front-matter
      // captured after the TOC entry is discarded.
      if (current && current.num === null) {
        current.buf = [];
      } else {
        flush();
        current = { num: null, buf: [] };
      }
      inPreface = true;
      continue;
    }
    const ch = t.match(chapterRe);
    if (ch) {
      flush();
      inPreface = false;
      chapter = ch[2].trim();
      continue;
    }
    const ap = !inPreface && line.match(aphorismRe);
    // Only accept the next sequential number — rejects numbers that merely
    // start a wrapped line mid-aphorism.
    if (ap && Number(ap[1]) === expected && chapter) {
      flush();
      current = { num: expected, buf: [ap[2]] };
      expected++;
      continue;
    }
    if (current) current.buf.push(line);
  }
  flush();

  // Sanity checks: BGE has a preface + aphorisms 1..296.
  const nums = chunks.filter((c) => c.aphorism !== null).map((c) => c.aphorism);
  if (nums.length !== 296 || nums[0] !== 1 || nums[nums.length - 1] !== 296) {
    throw new Error(
      `Expected aphorisms 1..296, got ${nums.length} (first ${nums[0]}, last ${nums[nums.length - 1]})`
    );
  }
  if (chunks.filter((c) => c.id === "bge-preface").length !== 1) {
    throw new Error("Expected exactly one preface chunk");
  }
  const ids = new Set(chunks.map((c) => c.id));
  if (ids.size !== chunks.length) throw new Error("Duplicate chunk ids");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const meta = {
    sourceId: SOURCE_ID,
    title: "Beyond Good and Evil",
    author: "Friedrich Nietzsche",
    translator: "Helen Zimmern",
    license: "public-domain",
    provenance: GUTENBERG_URL,
    chunking: "one aphorism per chunk; citation 'BGE §n'; preface separate; 'From the Heights' poem excluded (translated by L.A. Magnus, not Zimmern)",
    chunkCount: chunks.length,
    generatedBy: "scripts/ingest-bge-zimmern.ts",
  };
  fs.writeFileSync(path.join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "chunks.json"), JSON.stringify(chunks, null, 2));
  console.log(`Wrote ${chunks.length} chunks (preface + 296 aphorisms) to ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
