import embeddingData from "@/data/source-embeddings.json";
import type { PanelSource } from "./panel-source-display";
import type { Philosopher } from "./types";

export type { PanelSource, PanelSourceKind } from "./panel-source-display";

/**
 * The "Show sources" panel: which sources a philosopher's reply actually drew
 * on, chosen AFTER the reply by a cheap model reading the reply itself.
 *
 * This replaced showing the pre-reply grounding excerpts, which were picked by
 * embedding similarity to the question alone and so were often unrelated to
 * what was said (asked about the transcendental ego, the panel showed "the
 * look"). Two properties make the picker safe:
 *
 * - It can only SELECT from a closed list built here. It never writes a
 *   citation, so it cannot invent one; a malformed or adversarial reply
 *   degrades to "no sources", never to a fabricated one.
 * - It runs after the reply and only when the panel is on, so it adds no
 *   latency to the voice path and costs nothing when unused.
 *
 * Panel material is never prompt grounding: section summaries live under
 * `sectionSources` in the embeddings file, which no prompt path reads.
 */

/** The short key the picker sees ("S12"), mapped back to a source server-side. */
export interface PickerCandidate extends PanelSource {
  key: string;
}

/** At most this many sources are shown per reply. */
export const MAX_PANEL_SOURCES = 3;

interface StoredSection {
  id: string;
  label: string;
  explanation: string;
  status: string;
}

const SECTIONS = (embeddingData as { sectionSources?: Record<string, StoredSection[]> })
  .sectionSources ?? {};

/**
 * Every source the picker may choose from for this philosopher: the curated
 * excerpts everyone has, then any verified section summaries. Short keys keep
 * the prompt compact and leave the model nothing long to mistype.
 */
export function pickerCandidates(philosopher: Philosopher): PickerCandidate[] {
  const curated: PanelSource[] = philosopher.sources.map((source, index) => ({
    id: `source:${philosopher.id}:${index + 1}`,
    kind: "curated_excerpt",
    label: source.label,
    text: source.text,
    status: "curated",
  }));
  const sections: PanelSource[] = (SECTIONS[philosopher.id] ?? []).map((unit) => ({
    id: unit.id,
    kind: "section_summary",
    label: unit.label,
    text: unit.explanation,
    status: unit.status,
  }));
  return [...curated, ...sections].map((source, index) => ({
    ...source,
    key: `S${index + 1}`,
  }));
}

/**
 * Turn the picker's raw reply into sources. Tolerant of prose around the JSON
 * (models sometimes add a sentence), strict about content: only keys that are
 * in the candidate list survive, duplicates collapse, and the list is capped.
 * Anything unparseable yields [] — showing nothing beats showing a guess.
 */
export function parsePickerReply(
  raw: string,
  candidates: PickerCandidate[],
): PanelSource[] {
  const match = raw.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const byKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const chosen: PanelSource[] = [];
  const seen = new Set<string>();
  for (const value of parsed) {
    if (typeof value !== "string") continue;
    const candidate = byKey.get(value.trim().toUpperCase());
    if (!candidate || seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    const { key: _key, ...source } = candidate;
    chosen.push(source);
    if (chosen.length === MAX_PANEL_SOURCES) break;
  }
  return chosen;
}
