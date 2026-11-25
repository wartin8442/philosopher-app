/**
 * Client-safe half of the "Show sources" panel: the shape of a source and the
 * trust label shown with it. Kept apart from panel-sources.ts, which imports
 * the multi-megabyte embeddings file and must never reach the browser bundle.
 */

export type PanelSourceKind = "curated_excerpt" | "section_summary";

export interface PanelSource {
  id: string;
  kind: PanelSourceKind;
  /** Citation line: work and locator. */
  label: string;
  /** What the source says, in our words. */
  text: string;
  /** Trust level, shown to the student with every source. */
  status: string;
}

/**
 * The trust label shown with every source. The decision to show AI-checked
 * summaries at all (sectionStatusIsEligible in scripts/rag-corpus.ts) was made
 * on the condition that students always see this label, so a source with an
 * unrecognised status gets the most cautious wording rather than none.
 */
export function trustLabel(source: Pick<PanelSource, "kind" | "status">): string {
  if (source.kind === "curated_excerpt") return "Curated excerpt";
  if (source.status === "expert-verified") return "Section summary · checked by an expert";
  if (source.status === "agent-verified") return "Section summary · AI-checked against the text";
  return "Section summary · unverified";
}
