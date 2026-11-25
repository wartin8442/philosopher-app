import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type CorpusUnitType =
  | "position_card"
  | "verified_quote"
  | "misattribution_warning"
  | "section_summary";

export interface CorpusUnit {
  id: string;
  type: CorpusUnitType;
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
}

function stableSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function relativePath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function field(block: string, name: string): string {
  const match = block.match(
    new RegExp(`\\*\\*${name}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Za-z][^\\n]*?:\\*\\*|$)`),
  );
  return (match?.[1] ?? "").trim();
}

function listField(block: string, name: string): string[] {
  return field(block, name)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);
}

function assertUnique(units: CorpusUnit[]): CorpusUnit[] {
  const ids = new Set<string>();
  for (const unit of units) {
    if (ids.has(unit.id)) throw new Error(`Duplicate corpus unit id: ${unit.id}`);
    ids.add(unit.id);
  }
  return units;
}

export function parsePositionCards(root = process.cwd()): CorpusUnit[] {
  const dir = path.join(root, "data", "rag", "cards", "drafts");
  const units: CorpusUnit[] = [];

  for (const filename of readdirSync(dir).filter((name) => name.endsWith(".md")).sort()) {
    const philosopher = path.basename(filename, ".md");
    const filePath = path.join(dir, filename);
    const markdown = readFileSync(filePath, "utf8");
    // Most cards end at an explicit horizontal rule, but a few final cards
    // end at EOF. Accept both without making the delimiter part of the unit.
    const cardPattern = /^###\s+(.+)\r?\n([\s\S]*?)(?=^---\s*$|(?![\s\S]))/gm;
    let match: RegExpExecArray | null;

    while ((match = cardPattern.exec(markdown))) {
      const title = match[1].trim();
      const block = match[2];
      const claim = field(block, "Claim");
      const explanation = field(block, "Explanation");
      const citations = listField(block, "Citations");
      const provenance = field(block, "Provenance");
      const status = field(block, "Status");

      if (!claim || !explanation || citations.length === 0 || !provenance || !status) {
        throw new Error(`Incomplete position card: ${filename} / ${title}`);
      }

      units.push({
        id: `card:${philosopher}:${stableSlug(title)}`,
        type: "position_card",
        philosopher,
        title,
        claim,
        explanation,
        citations,
        provenance,
        status,
        sourcePath: relativePath(root, filePath),
        label: `${title} (${citations.join("; ")})`,
        text: `Claim: ${claim}\nExplanation: ${explanation}`,
      });
    }
  }

  return assertUnique(units);
}

interface QuoteCandidate {
  quote: string;
  work?: string;
  citation?: string;
  translator?: string;
  verification?: string;
  note?: string;
}

interface MisattributionCandidate {
  quote: string;
  explanation: string;
  /**
   * Same gate as `QuoteCandidate.verification`: an entry is eligible only when
   * this starts with "verified". A warning is not safe merely because someone
   * wrote it down — asserting "you never said that" about a line the
   * philosopher *did* write is itself a real failure (the baseline's
   * `sartre-q35-c1` did exactly that), so warnings carry the same burden of
   * proof as quotations, not a lighter one.
   */
  verification?: string;
  /** Who or what the line actually traces to, when established. */
  actualSource?: string;
}

interface QuoteFile {
  philosopher: string;
  sourceMethod: string;
  quotes: QuoteCandidate[];
  /** Lines established as not the philosopher's. */
  misattributions?: MisattributionCandidate[];
  /**
   * Lines circulating without any locatable source. Not categorically
   * excluded: which array an entry sits in records how the curator classified
   * it, while `verification` alone decides eligibility. That keeps the rule
   * uniform, and matches the standing warning that a Wikiquote "Disputed" tag
   * is applied inconsistently and cannot be trusted on its own.
   */
  disputed?: MisattributionCandidate[];
}

export function parseVerifiedQuotes(root = process.cwd()): CorpusUnit[] {
  const dir = path.join(root, "data", "rag", "quotes", "drafts");
  const units: CorpusUnit[] = [];

  for (const filename of readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const filePath = path.join(dir, filename);
    const data = JSON.parse(readFileSync(filePath, "utf8")) as QuoteFile;
    for (const quote of data.quotes ?? []) {
      if (!quote.verification?.toLowerCase().startsWith("verified")) continue;
      const citation = quote.citation ?? quote.work ?? "verified source";
      const title = `${quote.work ?? "Verified quotation"} — ${citation}`;
      units.push({
        id: `quote:${data.philosopher}:${stableSlug(citation)}:${stableSlug(quote.quote).slice(0, 48)}`,
        type: "verified_quote",
        philosopher: data.philosopher,
        title,
        claim: quote.quote,
        explanation: quote.note ?? "Verbatim wording verified against the cited source.",
        citations: [citation],
        provenance: data.sourceMethod,
        status: quote.verification,
        sourcePath: relativePath(root, filePath),
        label: `${title} [verified quotation]`,
        text: `Verified quotation: “${quote.quote}”${quote.translator ? ` Translator: ${quote.translator}.` : ""}${quote.note ? ` Note: ${quote.note}` : ""}`,
      });
    }
  }

  return assertUnique(units);
}

/**
 * Verified misattribution warnings — the "do not present this as genuine"
 * half of the narrowed corpus.
 *
 * These guard the same category verified quotes do: exact wording and exact
 * attribution, which the model cannot check by introspection because it does
 * not know when it is wrong. Unlike a position card, the unit is not a
 * synthesis that can be vaguer than the model's own knowledge — it is a
 * specific string plus a specific correction.
 */
export function parseMisattributionWarnings(root = process.cwd()): CorpusUnit[] {
  const dir = path.join(root, "data", "rag", "quotes", "drafts");
  const units: CorpusUnit[] = [];

  for (const filename of readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const filePath = path.join(dir, filename);
    const data = JSON.parse(readFileSync(filePath, "utf8")) as QuoteFile;
    const candidates = [...(data.misattributions ?? []), ...(data.disputed ?? [])];

    for (const warning of candidates) {
      if (!warning.verification?.toLowerCase().startsWith("verified")) continue;
      const attribution = warning.actualSource ?? "no established source";
      units.push({
        id: `warning:${data.philosopher}:${stableSlug(warning.quote).slice(0, 56)}`,
        type: "misattribution_warning",
        philosopher: data.philosopher,
        title: `Misattributed: “${warning.quote}”`,
        claim: warning.quote,
        explanation: warning.explanation,
        citations: [attribution],
        provenance: warning.verification,
        status: warning.verification,
        sourcePath: relativePath(root, filePath),
        label: `Misattribution warning — “${warning.quote}”`,
        // The warned wording is embedded verbatim so a user quoting it back
        // ("did you write ...?") matches this unit rather than missing it.
        text:
          `MISATTRIBUTION WARNING — do not present this as your own words: “${warning.quote}” ` +
          `${warning.explanation} Actual source: ${attribution}.`,
      });
    }
  }

  return assertUnique(units);
}

/**
 * The status ladder for section guide entries, least to most trusted. Defined
 * in prose at the top of each data/rag/sections/<philosopher>.md file.
 */
export const SECTION_STATUSES = ["draft", "agent-verified", "expert-verified"] as const;
export type SectionStatus = (typeof SECTION_STATUSES)[number];

/**
 * Whether an entry at this status may reach the "Show sources" panel.
 *
 * No human on the project can check these summaries, so this one predicate is
 * the whole of the trust policy for section guides: it decides whether a
 * summary nobody qualified has read can be shown to a student as a source.
 */
export function sectionStatusIsEligible(status: SectionStatus): boolean {
  // Decided 2026-11-22: agent-verified is enough to be shown, because the
  // panel labels every summary with its status — the student sees "AI-checked
  // against the text", never an unqualified citation. A draft is never shown.
  return status === "agent-verified" || status === "expert-verified";
}

/**
 * Section guides: one unit per titled section of a major work, saying what
 * that section argues. Panel material, not prompt grounding — summaries are
 * our synthesis, and RETRIEVABLE_CORPUS_TYPES in src/lib/retrieval.ts keeps
 * synthesis out of the prompt for the reasons recorded there.
 *
 * Returns every well-formed entry whatever its status; callers filter with
 * `sectionStatusIsEligible`. An unknown status is a hard error rather than a
 * silent exclusion, so a typo like "agent verified" cannot quietly hide (or,
 * worse, quietly admit) an entry.
 */
export function parseSectionGuides(root = process.cwd()): CorpusUnit[] {
  const dir = path.join(root, "data", "rag", "sections");
  const units: CorpusUnit[] = [];

  for (const filename of readdirSync(dir).filter((name) => name.endsWith(".md")).sort()) {
    const philosopher = path.basename(filename, ".md");
    const filePath = path.join(dir, filename);
    const markdown = readFileSync(filePath, "utf8");
    // An entry ends at a horizontal rule, the next entry heading, or EOF.
    const entryPattern = /^###\s+(.+)\r?\n([\s\S]*?)(?=^---\s*$|^###\s|(?![\s\S]))/gm;
    let match: RegExpExecArray | null;

    while ((match = entryPattern.exec(markdown))) {
      const heading = match[1].trim();
      const block = match[2];
      const work = field(block, "Work");
      const locator = field(block, "Locator");
      const summary = field(block, "Summary");
      const keyTerms = field(block, "Key terms");
      const references = listField(block, "References");
      const verification = field(block, "Verification");
      const status = field(block, "Status");

      if (!work || !locator || !summary || references.length === 0 || !verification) {
        throw new Error(`Incomplete section guide entry: ${filename} / ${heading}`);
      }
      if (!(SECTION_STATUSES as readonly string[]).includes(status)) {
        throw new Error(
          `Unknown status "${status}" on section guide entry: ${filename} / ${heading}`,
        );
      }

      const workTitle = work.replace(/\s*\([^)]*\)\s*$/, "");
      const citation = `${workTitle}, ${locator}`;
      units.push({
        id: `section:${philosopher}:${stableSlug(workTitle)}:${stableSlug(locator)}`,
        type: "section_summary",
        philosopher,
        title: heading,
        claim: locator,
        explanation: summary,
        citations: [citation],
        provenance: references.join("\n"),
        status,
        sourcePath: relativePath(root, filePath),
        label: `${workTitle} — ${locator}`,
        text: `${summary}${keyTerms ? ` Key terms: ${keyTerms}.` : ""}`,
      });
    }
  }

  return assertUnique(units);
}

/**
 * Section guide units the "Show sources" panel may show. Embedded under their
 * own key (`sectionSources`), never in `corpusSources`, so no prompt-grounding
 * path can reach them — see RETRIEVABLE_CORPUS_TYPES in src/lib/retrieval.ts.
 */
export function loadPanelSectionUnits(root = process.cwd()): CorpusUnit[] {
  return parseSectionGuides(root).filter((unit) =>
    sectionStatusIsEligible(unit.status as SectionStatus),
  );
}

export function loadEligibleCorpusUnits(root = process.cwd()): CorpusUnit[] {
  return assertUnique([
    ...parsePositionCards(root),
    ...parseVerifiedQuotes(root),
    ...parseMisattributionWarnings(root),
  ]);
}
