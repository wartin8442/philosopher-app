export type AnswerLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "primary-text";

export const ANSWER_LEVELS: { id: AnswerLevel; label: string; hint: string }[] =
  [
    {
      id: "beginner",
      label: "Beginner",
      hint: "Plain language, minimal jargon, everyday examples.",
    },
    {
      id: "intermediate",
      label: "Intermediate",
      hint: "Introduces key terms and defines them.",
    },
    {
      id: "advanced",
      label: "Advanced",
      hint: "Assumes familiarity; full conceptual depth.",
    },
    {
      id: "primary-text",
      label: "Reading a Primary Text",
      hint: "Dense, in the register of the philosopher's own writing.",
    },
  ];

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface Philosopher {
  id: string;
  name: string;
  dates: string;
  /** One or two sentence description for the profile card. */
  blurb: string;
  /** Short phrase describing the voice/tone. */
  voiceNote: string;
  /** Accent color (tailwind-friendly hex) for the philosopher's theme. */
  accent: string;
  /** Initials used in the portrait placeholder. */
  initials: string;
  /** Path to a portrait photo under /public (e.g. "/philosophers/aquinas.jpg"). Falls back to initials if missing. */
  image?: string;
  /**
   * Fine-tunes how the circular portrait crops `image` when the subject
   * isn't centered in the photo. `position` is a CSS object-position value
   * (e.g. "50% 0%") that slides the cover-crop along the image's overflowing
   * axis. `zoom` magnifies the image around the face at (`focusX`,`focusY`)
   * — fractions of the image, 0–1 — and re-centers that point in the circle;
   * needed when the image has no overflow to slide (e.g. a square photo
   * with an off-center face).
   */
  imageCrop?: {
    position?: string;
    zoom?: number;
    focusX?: number;
    focusY?: number;
  };
  /** Optional ElevenLabs voice id; falls back to a default if unset. */
  elevenLabsVoiceId?: string;
  /** The curated, accurate system prompt (personality + positions). */
  systemPrompt: string;
  /** A handful of curated source excerpts for lightweight retrieval. */
  sources: SourceExcerpt[];
}

export interface PhilosopherWork {
  title: string;
  /** Year(s) of composition/publication, e.g. "1265–1274" or "1886". */
  year: string;
  /** 2–3 sentence description of what the work is about. */
  description: string;
  /**
   * Remote cover image of a recognizable edition (Open Library covers API).
   * When missing or failing to load, the UI falls back to a typographic
   * cover rendered in the philosopher's accent color.
   */
  coverUrl?: string;
  /** Which edition the cover shows, e.g. "Penguin Classics". */
  coverEdition?: string;
}

export interface PhilosopherProfile {
  /** Matches Philosopher.id. */
  id: string;
  /** Short name for CTAs: "Chat with Aquinas". */
  shortName: string;
  /** Large hero portrait under /public. Omit to show the initials fallback. */
  heroImage?: string;
  /** CSS object-position keeping the face in view as the hero crops. */
  heroFocus?: string;
  /** 5–7 sentence accessible introduction, split into paragraphs. */
  intro: string[];
  /** 3–5 major works. */
  works: PhilosopherWork[];
}

export interface SourceExcerpt {
  /** Short citation label, e.g. "Summa Theologiae I-II, Q.94". */
  label: string;
  /** 1-3 sentence excerpt or paraphrase from a reliable source. */
  text: string;
}

export type DuelPhase =
  | "opening"
  | "critique"
  | "rebuttal"
  | "cross-exam"
  | "recap";

export const DUEL_PHASES: { id: DuelPhase; label: string; description: string }[] =
  [
    { id: "opening", label: "Opening", description: "Each states their position." },
    { id: "critique", label: "Critique", description: "Each critiques the other." },
    { id: "rebuttal", label: "Rebuttal", description: "Each rebuts the critique." },
    {
      id: "cross-exam",
      label: "Cross-examination",
      description: "Open exchange; you may interject.",
    },
    { id: "recap", label: "Recap", description: "A neutral summary." },
  ];

export interface DuelTurn {
  /** philosopher id, or "system" for the neutral recap, or "user" for interjections. */
  speaker: string;
  phase: DuelPhase;
  content: string;
}
