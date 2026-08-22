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

/**
 * Diagnostic routing metadata (docs/diagnostic_routing_design.md).
 *
 * The router retrieves a pool per topic, splits it by pole, and fills four
 * slots per group under a per-`approach` cap. Only two fields are needed for
 * that: which of the four routes to a position a philosopher takes
 * (`approach`), and how strongly plus in which direction they land on each
 * topic's axis (`topics`).
 */

/** How a philosopher characteristically persuades. Spreads every group. */
export type Approach = "rational" | "empirical" | "experiential" | "literary";

/**
 * The ten topic axes. One field per topic — two topics sharing a field is the
 * definition of two shelves with the same people on them, which D2/D4 rule
 * out (design doc, "The data").
 */
export type DiagnosticTopic =
  | "sufficiency"
  | "moral_source"
  | "consolation"
  | "selfhood"
  | "agency"
  | "legitimacy"
  | "transcendence"
  | "depth"
  | "standpoint"
  | "sociality";

/**
 * A tag is a magnitude and a pole, encoded as one signed integer.
 *
 * Why signed rather than `{ value, pole }`: the design doc already specifies
 * these axes as `−3…+3` stance fields, so the sign *is* the authored pole and
 * a separate field would be a second place to get it wrong. Magnitude is
 * `Math.abs`, pole is `Math.sign`, and the pool filter is one comparison.
 *
 * The direction of every axis is fixed by TOPIC_POLES below — negative is the
 * first-named pole — and pinned by `diagnosticTags.test.ts` so a later edit
 * cannot silently invert a topic and swap two shelves.
 *
 * 0 and ±1 are excluded by the type: tags are authored sparsely, and an
 * absent key means "tag 1 or 0, out of the pool" (the pool is tag ≥ 2).
 */
export type TopicTag = -3 | -2 | 2 | 3;

/** Sparse: only topics the philosopher is tagged ≥ 2 on appear. */
export type TopicTags = Partial<Record<DiagnosticTopic, TopicTag>>;

/**
 * Pole labels per axis, in signed order. Read as `negative ↔ positive`,
 * matching the design doc's stance-field table and the screen-2 draft's
 * finding A table.
 */
export const TOPIC_POLES: Record<
  DiagnosticTopic,
  { negative: string; positive: string }
> = {
  sufficiency: { negative: "enough", positive: "more" },
  moral_source: { negative: "made", positive: "found" },
  consolation: { negative: "face", positive: "reframe" },
  selfhood: { negative: "no core", positive: "core" },
  agency: { negative: "made", positive: "makes himself" },
  legitimacy: { negative: "conditioning", positive: "consent" },
  transcendence: {
    negative: "nothing beyond nature",
    positive: "a divine order",
  },
  depth: { negative: "nothing behind", positive: "something behind" },
  standpoint: { negative: "perspectival", positive: "objective" },
  sociality: {
    negative: "others cost you yourself",
    positive: "others complete you",
  },
};

export const DIAGNOSTIC_TOPICS = Object.keys(
  TOPIC_POLES,
) as DiagnosticTopic[];

/**
 * Which end of a topic's axis a group sits on. Negative and positive name the
 * poles in TOPIC_POLES order (negative is the first-named pole).
 *
 * This lives here rather than in `routing.ts` so the client flow can talk
 * about poles without importing the module that pulls in every system prompt.
 * `routing.ts` re-exports both for the callers that already read them there.
 */
export type Pole = "negative" | "positive";

/** The other end of the axis. */
export function oppositePole(pole: Pole): Pole {
  return pole === "positive" ? "negative" : "positive";
}

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
  /**
   * Diagnostic routing: which of the four routes this philosopher takes.
   * Set on every member of the main roster (`PHILOSOPHERS`); optional because
   * the contextual-only personas are not routed to.
   */
  approach?: Approach;
  /** Diagnostic routing: sparse topic tags. See TopicTags. */
  topics?: TopicTags;
}

export interface PhilosopherWork {
  title: string;
  /** Year(s) of composition/publication, e.g. "1265–1274" or "1886". */
  year: string;
  /** 2–3 sentence description of what the work is about. */
  description: string;
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
  /** Accessible introduction, split into paragraphs. */
  intro: string[];
  /** Optional source or media link appended to the final intro paragraph. */
  introLink?: { label: string; href: string };
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
