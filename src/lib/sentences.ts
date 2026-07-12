/**
 * Incremental sentence chunker for streaming TTS.
 *
 * Feed it text fragments as they arrive from the LLM stream; it returns
 * complete sentences as soon as they can be *safely* identified. "Safely"
 * matters because in a stream the end of the buffer is ambiguous: a trailing
 * "." might be a sentence end, an abbreviation, or the middle of "1844.5".
 * So a terminator only counts once the following whitespace has arrived.
 */

export interface SentenceChunker {
  /** Add a text fragment; returns any sentences completed by it. */
  push(fragment: string): string[];
  /** End of stream: returns whatever text remains, if any. */
  flush(): string[];
}

/** Words whose trailing "." is an abbreviation, not a sentence end. */
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "st", "sr", "jr", "vs", "etc",
  "cf", "ca", "al", "vol", "ch", "no", "op", "pp", "fig",
]);

/** Characters that may trail a terminator and belong to the same sentence. */
const CLOSERS = `.!?"')’”]`;

/**
 * Fragments shorter than this are not emitted on their own; they merge into
 * the following sentence. Prevents list numbering ("1.") or a lone "Yes."
 * from becoming its own synthesis request.
 */
const MIN_EMIT_LENGTH = 8;

/**
 * Finds the next safe cut point at or after `from`.
 * Returns the index just past the sentence end, or -1 if the buffered text
 * contains none yet (including "can't know yet" cases at the buffer's end).
 */
function findCut(buf: string, from: number): number {
  for (let i = from; i < buf.length; i++) {
    const c = buf[i];

    // A newline is a hard break (paragraph/list boundary) regardless of
    // punctuation, as long as there is something before it to speak.
    if (c === "\n") {
      if (buf.slice(0, i).trim()) return i + 1;
      continue;
    }

    if (c !== "." && c !== "!" && c !== "?") continue;

    // Absorb a run of terminators plus closing quotes/brackets ( ..." !?) )
    // so the cut lands after the whole cluster.
    let end = i;
    while (end + 1 < buf.length && CLOSERS.includes(buf[end + 1])) end++;

    // The cluster reaches the buffer's end: ambiguous until more text
    // arrives, so stop scanning entirely and wait.
    if (end + 1 >= buf.length) return -1;

    // A real sentence end is followed by whitespace ("3.14" is not).
    if (!/\s/.test(buf[end + 1])) continue;

    // Single "." — reject abbreviations ("Mr.") and initials ("J. S. Mill";
    // this also covers "e.g." and "i.e." via their single-letter last part).
    if (c === "." && buf[i + 1] !== ".") {
      const word = /([A-Za-z]+)$/.exec(buf.slice(0, i))?.[1]?.toLowerCase();
      if (word && (word.length === 1 || ABBREVIATIONS.has(word))) continue;
    }

    return end + 1;
  }
  return -1;
}

export function createSentenceChunker(): SentenceChunker {
  let buf = "";

  return {
    push(fragment: string): string[] {
      buf += fragment;
      const out: string[] = [];
      let searchFrom = 0;
      while (true) {
        const cut = findCut(buf, searchFrom);
        if (cut === -1) break;
        const candidate = buf.slice(0, cut).trim();
        if (candidate.length >= MIN_EMIT_LENGTH) {
          out.push(candidate);
          buf = buf.slice(cut);
          searchFrom = 0;
        } else {
          // Too short to speak alone: leave it in the buffer and look for
          // the next cut, so it merges into the following sentence.
          searchFrom = cut;
        }
      }
      return out;
    },

    flush(): string[] {
      const rest = buf.trim();
      buf = "";
      return rest ? [rest] : [];
    },
  };
}
