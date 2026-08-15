import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import embeddingData from "../src/data/source-embeddings.json";
import { hashText, sourceEmbeddingText } from "../src/lib/embeddings";
import { PHILOSOPHERS } from "../src/lib/philosophers";
import {
  loadEligibleCorpusUnits,
  parseMisattributionWarnings,
  parsePositionCards,
  parseVerifiedQuotes,
} from "./rag-corpus";

const ROOT = process.cwd();
const CARD_DIR = path.join(ROOT, "data", "rag", "cards", "drafts");
const QUOTE_DIR = path.join(ROOT, "data", "rag", "quotes", "drafts");

interface GeneratedCorpusRecord {
  id: string;
  type: string;
  philosopher: string;
  title: string;
  claim: string;
  explanation: string;
  citations: string[];
  provenance: string;
  status: string;
  sourcePath: string;
  label: string;
  text: string;
  hash: string;
  vector: number[];
}

function rawCardCount(): number {
  return readdirSync(CARD_DIR)
    .filter((name) => name.endsWith(".md"))
    .reduce((count, name) => {
      const markdown = readFileSync(path.join(CARD_DIR, name), "utf8");
      return count + (markdown.match(/^###\s+.+$/gm)?.length ?? 0);
    }, 0);
}

interface RawWarning {
  quote: string;
  verification?: string;
}

interface RawQuoteFile {
  quotes?: { quote: string; verification?: string }[];
  misattributions?: RawWarning[];
  disputed?: RawWarning[];
}

function rawQuoteFiles(): RawQuoteFile[] {
  return readdirSync(QUOTE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(readFileSync(path.join(QUOTE_DIR, name), "utf8")) as RawQuoteFile);
}

describe("RAG corpus eligibility", () => {
  it("generated embeddings contain every curated excerpt and all 267 eligible units with metadata intact", () => {
    const generated = embeddingData as {
      version: number;
      dims: number;
      sources: Record<string, { hash: string; vector: number[] }[]>;
      corpusSources: Record<string, GeneratedCorpusRecord[]>;
    };
    const philosopherCounts = {
      aquinas: 53,
      nietzsche: 62,
      kierkegaard: 50,
      sartre: 52,
      camus: 50,
      hume: 0,
    };
    const curated = Object.values(generated.sources).flat();
    const corpus = Object.values(generated.corpusSources).flat();
    const eligible = loadEligibleCorpusUnits(ROOT);

    expect(generated.version).toBe(2);
    expect(generated.dims).toBe(384);
    expect(curated).toHaveLength(
      PHILOSOPHERS.reduce(
        (total, philosopher) => total + philosopher.sources.length,
        0,
      ),
    );
    expect(corpus).toHaveLength(267);
    expect(corpus.filter((unit) => unit.type === "position_card")).toHaveLength(257);
    expect(corpus.filter((unit) => unit.type === "verified_quote")).toHaveLength(3);
    expect(corpus.filter((unit) => unit.type === "misattribution_warning")).toHaveLength(7);

    for (const [philosopher, corpusCount] of Object.entries(philosopherCounts)) {
      expect(generated.corpusSources[philosopher]).toHaveLength(corpusCount);
      expect(generated.corpusSources[philosopher].every(
        (unit) => unit.philosopher === philosopher,
      )).toBe(true);
    }

    for (const philosopher of PHILOSOPHERS) {
      expect(generated.sources[philosopher.id].map((stored) => stored.hash)).toEqual(
        philosopher.sources.map((source) =>
          hashText(sourceEmbeddingText(source.label, source.text)),
        ),
      );
    }

    const stripVector = ({ hash: _hash, vector: _vector, ...unit }: GeneratedCorpusRecord) => unit;
    const byId = <T extends { id: string }>(left: T, right: T) => left.id.localeCompare(right.id);
    expect(corpus.map(stripVector).sort(byId)).toEqual([...eligible].sort(byId));
    expect([...new Set(corpus.map((unit) => unit.id))]).toHaveLength(267);
    expect(corpus.every(
      (unit) => unit.hash === hashText(sourceEmbeddingText(unit.label, unit.text)),
    )).toBe(true);
    expect([...curated, ...corpus].every(
      (unit) => unit.vector.length === 384 && unit.vector.every(Number.isFinite),
    )).toBe(true);
  });

  it("indexes every one of the 257 cards exactly once with stable IDs and source metadata", () => {
    const cards = parsePositionCards(ROOT);
    const ids = cards.map((card) => card.id);
    const stableIdDigest = createHash("sha256")
      .update([...ids].sort().join("\n"))
      .digest("hex");

    expect(rawCardCount()).toBe(257);
    expect(cards).toHaveLength(257);
    expect(new Set(ids).size).toBe(257);
    expect(stableIdDigest).toBe("5636648451e0c1e95479065a8984b238e36ffe633ced7d47247337e8ebbf2065");
    expect(parsePositionCards(ROOT).map((card) => card.id)).toEqual(ids);

    expect(cards.every((card) => card.type === "position_card")).toBe(true);
    expect(cards.every((card) => card.citations.length > 0 && card.citations.every(Boolean))).toBe(true);
    expect(cards.every((card) => card.provenance.length > 0)).toBe(true);
    expect(cards.every((card) => card.status === "draft")).toBe(true);
    expect(cards.every((card) => card.sourcePath === `data/rag/cards/drafts/${card.philosopher}.md`)).toBe(true);
  });

  it("admits only explicitly verified quotes and warnings, and excludes every pending one", () => {
    const files = rawQuoteFiles();
    const rawQuotes = files.flatMap((file) => file.quotes ?? []);
    const pendingQuotes = rawQuotes.filter(
      (quote) => !quote.verification?.toLowerCase().startsWith("verified"),
    );
    const rawWarnings = files.flatMap((file) => [
      ...(file.misattributions ?? []),
      ...(file.disputed ?? []),
    ]);
    const pendingWarnings = rawWarnings.filter(
      (warning) => !warning.verification?.toLowerCase().startsWith("verified"),
    );
    const verified = parseVerifiedQuotes(ROOT);
    const warnings = parseMisattributionWarnings(ROOT);
    const eligible = loadEligibleCorpusUnits(ROOT);

    expect(rawQuotes).toHaveLength(55);
    expect(pendingQuotes).toHaveLength(52);
    expect(rawWarnings).toHaveLength(15);
    expect(pendingWarnings).toHaveLength(8);

    expect(verified).toHaveLength(3);
    expect(verified.every((unit) => unit.type === "verified_quote")).toBe(true);
    expect(verified.map((unit) => unit.citations[0]).sort()).toEqual([
      "BGE \u00a7146",
      "BGE \u00a7153",
      "Z II, 'On the Poets' (Von den Dichtern)",
    ]);

    expect(warnings).toHaveLength(7);
    expect(warnings.every((unit) => unit.type === "misattribution_warning")).toBe(true);
    // The warned wording must be embedded verbatim, or a user quoting it back
    // cannot match the warning that exists to catch exactly that.
    expect(warnings.every((unit) => unit.text.includes(unit.claim))).toBe(true);
    expect(warnings.every((unit) => unit.citations[0]?.length > 0)).toBe(true);

    expect([...verified, ...warnings].every(
      (unit) => unit.status.toLowerCase().startsWith("verified"),
    )).toBe(true);
    expect(eligible).toHaveLength(267);

    const eligibleClaims = new Set(eligible.map((unit) => unit.claim));
    expect(pendingQuotes.every((quote) => !eligibleClaims.has(quote.quote))).toBe(true);
    expect(pendingWarnings.every((warning) => !eligibleClaims.has(warning.quote))).toBe(true);
  });

  it("no longer treats the genuine Zarathustra 'muddy the water' line as a misattribution", () => {
    // Regression guard for a corrected factual error: this line renders
    // "sie tr\u00fcben alle ihr Gew\u00e4sser, da\u00df es tief scheine" (Also sprach
    // Zarathustra II, "Von den Dichtern") and was previously filed as having
    // no source in Nietzsche. A warning unit for it would drive the persona to
    // deny a real quote.
    const eligible = loadEligibleCorpusUnits(ROOT);
    const muddy = eligible.filter((unit) => unit.claim.toLowerCase().includes("muddy the water"));

    expect(muddy).toHaveLength(1);
    expect(muddy[0].type).toBe("verified_quote");
    expect(muddy[0].citations[0]).toContain("On the Poets");
    expect(eligible.some(
      (unit) => unit.type === "misattribution_warning" && unit.claim.toLowerCase().includes("muddy"),
    )).toBe(false);
  });
});
