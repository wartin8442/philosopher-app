import type { Philosopher } from "./types";

/**
 * The subset of a `Philosopher` the browser actually renders.
 *
 * `lib/philosophers.ts` is ~96KB of source, most of it the 24 curated
 * `systemPrompt` blocks and their `sources` excerpts — material the model
 * needs and the user must never see. Importing that module from a `"use
 * client"` component pulls all of it into the page's JavaScript bundle (the
 * conversation route's dev chunk measured 1.57MB, with the prompt text
 * greppable inside it), which the browser then has to download and parse
 * before the page becomes interactive.
 *
 * So client components take this projection as a prop instead, and the server
 * component at the route boundary is the only thing that touches the full
 * record. This type is deliberately data-free — importing it costs nothing.
 */
export interface PhilosopherDisplay {
  id: string;
  name: string;
  dates: string;
  voiceNote: string;
  accent: string;
  initials: string;
  image?: string;
  imageCrop?: Philosopher["imageCrop"];
}

/** Narrow a full philosopher record to the fields the UI renders. */
export function toPhilosopherDisplay(philosopher: Philosopher): PhilosopherDisplay {
  return {
    id: philosopher.id,
    name: philosopher.name,
    dates: philosopher.dates,
    voiceNote: philosopher.voiceNote,
    accent: philosopher.accent,
    initials: philosopher.initials,
    image: philosopher.image,
    imageCrop: philosopher.imageCrop,
  };
}

/** A work focus resolved from `?work=`, carrying only what the client needs. */
export interface WorkFocus {
  title: string;
  /** Precomputed so the client never imports `profiles.ts` for `workSlug`. */
  slug: string;
}
