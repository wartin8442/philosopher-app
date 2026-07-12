import { describe, expect, it } from "vitest";
import { createSentenceChunker } from "./sentences";

/** Helper: feed the whole text in small fragments, like an LLM stream. */
function streamIn(text: string, fragmentSize = 5): string[] {
  const chunker = createSentenceChunker();
  const out: string[] = [];
  for (let i = 0; i < text.length; i += fragmentSize) {
    out.push(...chunker.push(text.slice(i, i + fragmentSize)));
  }
  out.push(...chunker.flush());
  return out;
}

describe("createSentenceChunker", () => {
  it("splits sentences even when fed in tiny fragments", () => {
    expect(streamIn("The absurd is born of confrontation. Man calls out. The world is silent.")).toEqual([
      "The absurd is born of confrontation.",
      "Man calls out.",
      "The world is silent.",
    ]);
  });

  it("handles ? and ! terminators", () => {
    expect(streamIn("What is the good life? Ask, and keep asking! Nothing less will do.")).toEqual([
      "What is the good life?",
      "Ask, and keep asking!",
      "Nothing less will do.",
    ]);
  });

  it("does not split after abbreviations or initials", () => {
    expect(streamIn("Mr. Kierkegaard wrote of dread. J. S. Mill disagreed with e.g. Bentham on this.")).toEqual([
      "Mr. Kierkegaard wrote of dread.",
      "J. S. Mill disagreed with e.g. Bentham on this.",
    ]);
  });

  it("does not split inside decimal numbers", () => {
    expect(streamIn("Pi is roughly 3.14159 by most counts. Euler knew more.")).toEqual([
      "Pi is roughly 3.14159 by most counts.",
      "Euler knew more.",
    ]);
  });

  it("keeps trailing quotes with their sentence", () => {
    expect(streamIn('The oracle said "know thyself." Socrates obeyed.')).toEqual([
      'The oracle said "know thyself."',
      "Socrates obeyed.",
    ]);
  });

  it("treats ellipses as a boundary when followed by space", () => {
    expect(streamIn("One must imagine... yes, one must. Sisyphus smiles.")).toEqual([
      "One must imagine...",
      "yes, one must.",
      "Sisyphus smiles.",
    ]);
  });

  it("merges list numbering into the following sentence", () => {
    expect(streamIn("1. Know thyself and doubt everything. 2. Nothing in excess ever.")).toEqual([
      "1. Know thyself and doubt everything.",
      "2. Nothing in excess ever.",
    ]);
  });

  it("splits at newlines even without terminal punctuation", () => {
    expect(streamIn("First a thought about virtue\nThen another about vice entirely.")).toEqual([
      "First a thought about virtue",
      "Then another about vice entirely.",
    ]);
  });

  it("waits for whitespace after a terminator at the buffer edge", () => {
    const chunker = createSentenceChunker();
    // Ends exactly on "." — ambiguous, so nothing should be emitted yet.
    expect(chunker.push("The year was 1844.")).toEqual([]);
    // The next fragment reveals it was a real sentence end.
    expect(chunker.push(" He was born then.")).toEqual(["The year was 1844."]);
    expect(chunker.flush()).toEqual(["He was born then."]);
  });

  it("flush returns leftover text without a terminator", () => {
    const chunker = createSentenceChunker();
    chunker.push("And so we are left wondering");
    expect(chunker.flush()).toEqual(["And so we are left wondering"]);
    expect(chunker.flush()).toEqual([]);
  });
});
