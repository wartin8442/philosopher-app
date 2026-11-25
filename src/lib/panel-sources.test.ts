import { describe, expect, it } from "vitest";
import { getPhilosopher } from "./philosophers";
import { trustLabel } from "./panel-source-display";
import {
  MAX_PANEL_SOURCES,
  parsePickerReply,
  pickerCandidates,
} from "./panel-sources";

const sartre = getPhilosopher("sartre")!;
const hume = getPhilosopher("hume")!;
const kierkegaard = getPhilosopher("kierkegaard")!;

describe("pickerCandidates", () => {
  it("offers Sartre's curated excerpts and every verified section summary, keyed S1..Sn", () => {
    const candidates = pickerCandidates(sartre);
    const sections = candidates.filter((c) => c.kind === "section_summary");

    expect(candidates.filter((c) => c.kind === "curated_excerpt")).toHaveLength(
      sartre.sources.length,
    );
    expect(sections).toHaveLength(59);
    expect(candidates.map((c) => c.key)).toEqual(
      candidates.map((_, i) => `S${i + 1}`),
    );
    // The section that should answer a question about the transcendental ego.
    expect(sections.some((c) =>
      c.label.startsWith("The Transcendence of the Ego — Part I") &&
      c.label.includes("Formal Presence of the I"),
    )).toBe(true);
    // Never a draft: the panel only ever sees eligible statuses.
    expect(sections.every((c) => c.status === "agent-verified" || c.status === "expert-verified")).toBe(true);
  });

  it("offers Kierkegaard's sections from all five works, credited to the right pseudonym", () => {
    const sections = pickerCandidates(kierkegaard).filter((c) => c.kind === "section_summary");

    expect(sections).toHaveLength(79);
    for (const work of [
      "Fear and Trembling",
      "Philosophical Fragments",
      "The Concept of Anxiety",
      "Works of Love",
      "The Sickness unto Death",
    ]) {
      expect(sections.some((c) => c.label.startsWith(`${work} — `))).toBe(true);
    }
    // The section that should answer a question about the leap of faith.
    expect(sections.some((c) =>
      c.label.startsWith("Fear and Trembling — Problema I") &&
      c.label.includes("Teleological Suspension of the Ethical"),
    )).toBe(true);
    expect(sections.every((c) => c.status === "agent-verified" || c.status === "expert-verified")).toBe(true);
  });

  it("offers only curated excerpts for a philosopher with no section guide", () => {
    const candidates = pickerCandidates(hume);
    expect(candidates).toHaveLength(hume.sources.length);
    expect(candidates.every((c) => c.kind === "curated_excerpt")).toBe(true);
  });
});

describe("parsePickerReply", () => {
  const candidates = pickerCandidates(sartre);
  const ids = (raw: string) => parsePickerReply(raw, candidates).map((s) => s.id);

  it("maps chosen keys back to sources, in the order given", () => {
    expect(ids('["S6", "S2"]')).toEqual([candidates[5].id, candidates[1].id]);
  });

  it("returns sources without the picker-only key", () => {
    expect(parsePickerReply('["S1"]', candidates)[0]).not.toHaveProperty("key");
  });

  it("tolerates prose around the JSON and loose key casing", () => {
    expect(ids('The reply discusses this one:\n["s5"]\nThat is all.')).toEqual([
      candidates[4].id,
    ]);
    // An array wrapped in an object is still a closed-list answer.
    expect(ids('{"keys": ["S1"]}')).toEqual([candidates[0].id]);
  });

  it("drops keys outside the candidate list instead of inventing a source", () => {
    expect(ids('["S999", "S1", "Being and Nothingness p. 40"]')).toEqual([candidates[0].id]);
  });

  it("collapses duplicates and caps the panel", () => {
    expect(ids('["S1", "S1", "S2", "S3", "S4", "S5"]')).toHaveLength(MAX_PANEL_SOURCES);
    expect(new Set(ids('["S1", "S1", "S2"]')).size).toBe(2);
  });

  it("shows nothing rather than guessing when the reply is not a JSON array", () => {
    expect(ids("[]")).toEqual([]);
    expect(ids("S1, S2")).toEqual([]);
    expect(ids("[S1, S2")).toEqual([]);
    expect(ids("[S1, S2]")).toEqual([]); // unquoted: not valid JSON
    expect(ids("")).toEqual([]);
  });
});

describe("trustLabel", () => {
  it("always tells the student how far a source was checked", () => {
    expect(trustLabel({ kind: "curated_excerpt", status: "curated" })).toBe("Curated excerpt");
    expect(trustLabel({ kind: "section_summary", status: "agent-verified" })).toBe(
      "Section summary · AI-checked against the text",
    );
    expect(trustLabel({ kind: "section_summary", status: "expert-verified" })).toBe(
      "Section summary · checked by an expert",
    );
    // An unrecognised status gets the most cautious wording, never none.
    expect(trustLabel({ kind: "section_summary", status: "draft" })).toBe(
      "Section summary · unverified",
    );
  });
});
