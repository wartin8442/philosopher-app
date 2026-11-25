import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseSectionGuides, sectionStatusIsEligible } from "./rag-corpus";

function entry(overrides: Partial<Record<string, string>> = {}): string {
  const fields = {
    Work: "The Transcendence of the Ego (1936–37)",
    Locator: 'Part I "The I and the Me", §A "The Theory of the Formal Presence of the I"',
    Summary: "Sartre argues there is no transcendental I in unreflected consciousness.",
    "Key terms": "transcendental I; intentionality",
    References: "- Primary text: trans. Williams and Kirkpatrick (1957), Part I §A",
    Verification: "pending",
    Status: "draft",
    ...overrides,
  };
  const body = Object.entries(fields)
    .filter(([, value]) => value !== "")
    .map(([name, value]) => `**${name}:**${name === "References" ? "\n" : " "}${value}`)
    .join("\n\n");
  return `### The Transcendence of the Ego — I.A\n\n${body}\n`;
}

let root: string | undefined;

function fixture(files: Record<string, string>): string {
  root = mkdtempSync(path.join(tmpdir(), "section-guides-"));
  const dir = path.join(root, "data", "rag", "sections");
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), content);
  }
  return root;
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe("section guides", () => {
  it("parses an entry into a section_summary unit citing work and locator, never a page", () => {
    const [unit] = parseSectionGuides(fixture({ "sartre.md": `# Sartre\n\n---\n\n${entry()}` }));
    expect(unit).toMatchObject({
      id: "section:sartre:the-transcendence-of-the-ego:part-i-the-i-and-the-me-a-the-theory-of-the-formal-presence-of-the-i",
      type: "section_summary",
      philosopher: "sartre",
      status: "draft",
      citations: [
        'The Transcendence of the Ego, Part I "The I and the Me", §A "The Theory of the Formal Presence of the I"',
      ],
    });
    expect(unit.text).toContain("Key terms: transcendental I; intentionality.");
  });

  it("separates consecutive entries without bleeding fields across them", () => {
    const second = entry({ Locator: 'Part I "The I and the Me", §B "The Cogito as Reflective Consciousness"' })
      .replace("— I.A", "— I.B");
    const units = parseSectionGuides(fixture({ "sartre.md": `${entry()}\n---\n\n${second}` }));
    expect(units.map((u) => u.claim)).toEqual([
      'Part I "The I and the Me", §A "The Theory of the Formal Presence of the I"',
      'Part I "The I and the Me", §B "The Cogito as Reflective Consciousness"',
    ]);
  });

  it("rejects an entry missing its references rather than shipping an uncited summary", () => {
    expect(() =>
      parseSectionGuides(fixture({ "sartre.md": entry({ References: "" }) })),
    ).toThrow(/Incomplete section guide entry/);
  });

  it("rejects an unknown status instead of silently admitting or dropping the entry", () => {
    expect(() =>
      parseSectionGuides(fixture({ "sartre.md": entry({ Status: "agent verified" }) })),
    ).toThrow(/Unknown status "agent verified"/);
  });

  it("never shows a draft", () => {
    expect(sectionStatusIsEligible("draft")).toBe(false);
  });

  it("parses the committed section guides without error", () => {
    const units = parseSectionGuides();
    expect(units.length).toBeGreaterThan(0);
    expect(new Set(units.map((u) => u.type))).toEqual(new Set(["section_summary"]));
  });
});
